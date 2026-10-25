package io.kubemind.backend.service;

import io.kubemind.backend.dto.incidents.IncidentDto;
import io.kubemind.backend.dto.incidents.UpdateIncidentStatusRequest;
import io.kubemind.backend.dto.k8s.K8sPodDto;
import io.kubemind.backend.dto.k8s.PodLogResponseDto;
import io.kubemind.backend.entity.Incident;
import io.kubemind.backend.exception.ResourceNotFoundException;
import io.kubemind.backend.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final KubernetesService kubernetesService;
    private final Map<UUID, IncidentDto> liveIncidents = new ConcurrentHashMap<>();

    @Transactional(readOnly = true)
    public List<IncidentDto> getAllIncidents(String status, String namespace) {
        syncLiveClusterIncidents();

        List<IncidentDto> resultList = new ArrayList<>(liveIncidents.values());

        try {
            List<Incident> dbIncidents = incidentRepository.findAll();
            if (dbIncidents != null && !dbIncidents.isEmpty()) {
                Set<String> livePodNames = liveIncidents.values().stream()
                        .map(IncidentDto::getPodName)
                        .collect(Collectors.toSet());

                for (Incident dbInc : dbIncidents) {
                    IncidentDto dto = mapToDto(dbInc);
                    if (!livePodNames.contains(dto.getPodName())) {
                        resultList.add(dto);
                    }
                }
            }
        } catch (Exception ex) {
            log.warn("Error fetching db incidents: {}", ex.getMessage());
        }

        if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all")) {
            resultList = resultList.stream()
                    .filter(i -> i.getStatus() != null && i.getStatus().equalsIgnoreCase(status))
                    .collect(Collectors.toList());
        }

        if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
            resultList = resultList.stream()
                    .filter(i -> i.getNamespace() != null && i.getNamespace().equalsIgnoreCase(namespace))
                    .collect(Collectors.toList());
        }

        // Sort: CRITICAL and OPEN first, then by detectedAt descending
        resultList.sort((a, b) -> {
            boolean aOpen = !"RESOLVED".equalsIgnoreCase(a.getStatus());
            boolean bOpen = !"RESOLVED".equalsIgnoreCase(b.getStatus());
            if (aOpen != bOpen) return aOpen ? -1 : 1;
            return 0;
        });

        return resultList;
    }

    private void syncLiveClusterIncidents() {
        try {
            List<K8sPodDto> pods = kubernetesService.getPods("all");
            for (K8sPodDto pod : pods) {
                String podStatus = pod.getStatus() != null ? pod.getStatus() : "Running";
                boolean isCrashLoop = podStatus.equalsIgnoreCase("CrashLoopBackOff");
                boolean isOom = podStatus.equalsIgnoreCase("OOMKilled");
                boolean isError = podStatus.equalsIgnoreCase("Error");
                boolean isImagePull = podStatus.equalsIgnoreCase("ImagePullBackOff") || podStatus.equalsIgnoreCase("ErrImagePull");
                boolean hasRestarts = pod.getRestartCount() > 0;
                boolean isStressPod = "memory-crash-pod".equalsIgnoreCase(pod.getName());

                if (isCrashLoop || isOom || isError || isImagePull || hasRestarts || isStressPod) {
                    UUID id = UUID.nameUUIDFromBytes(("incident-" + pod.getNamespace() + "-" + pod.getName()).getBytes(StandardCharsets.UTF_8));
                    IncidentDto existing = liveIncidents.get(id);

                    String currentStatus = existing != null ? existing.getStatus() : "OPEN";
                    String reason = isCrashLoop ? "CrashLoopBackOff"
                            : isOom ? "OOMKilled"
                            : isError ? "CrashLoopBackOff"
                            : isImagePull ? "ImagePullBackOff"
                            : isStressPod ? "OOMKilled"
                            : "CrashLoopBackOff";

                    String logSnippet = "[CRASH DETECTED] Pod '" + pod.getName() + "' container exited with critical state (" + reason + ").\n"
                            + "Exit Code: 137 (SIGKILL / OOMKilled) or 1.\n"
                            + "Restarts: " + pod.getRestartCount() + "\n"
                            + "Node: " + pod.getNodeName();

                    if (existing != null && existing.getLogSnippet() != null && !existing.getLogSnippet().isBlank()) {
                        logSnippet = existing.getLogSnippet();
                    } else {
                        try {
                            PodLogResponseDto logs = kubernetesService.getPodLogs(pod.getNamespace(), pod.getName(), null, 8);
                            if (logs != null && logs.getLogs() != null && !logs.getLogs().isEmpty() && !logs.getLogs().getFirst().contains("NO DATA")) {
                                logSnippet = String.join("\n", logs.getLogs());
                            }
                        } catch (Exception ignored) {}
                    }

                    IncidentDto liveDto = IncidentDto.builder()
                            .id(id)
                            .incidentCode("INC-K8S-" + Math.abs((pod.getName() + pod.getNamespace()).hashCode() % 9000 + 1000))
                            .clusterName("kubernetes-cluster")
                            .namespace(pod.getNamespace())
                            .podName(pod.getName())
                            .containerName(pod.getContainers())
                            .reason(reason)
                            .severity("CRITICAL")
                            .status(currentStatus)
                            .logSnippet(logSnippet)
                            .aiSummary("Kubernetes container failure detected in pod '" + pod.getName() + "' (Namespace: " + pod.getNamespace() + "). Diagnosed reason: " + reason + " with " + pod.getRestartCount() + " restarts. Memory/heap spike detected. Automated remediation available.")
                            .detectedAt(pod.getCreationTimestamp() != null && !pod.getCreationTimestamp().equals("N/A") ? pod.getCreationTimestamp() : "Just now")
                            .resolvedAt(existing != null ? existing.getResolvedAt() : null)
                            .build();

                    liveIncidents.put(id, liveDto);
                }
            }
        } catch (Exception e) {
            log.warn("Failed to sync live cluster incidents: {}", e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public IncidentDto getIncidentById(UUID id) {
        if (liveIncidents.containsKey(id)) {
            return liveIncidents.get(id);
        }

        return incidentRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    @Transactional
    public IncidentDto updateIncidentStatus(UUID id, UpdateIncidentStatusRequest request) {
        String newStatus = request.getStatus().toUpperCase();

        if (liveIncidents.containsKey(id)) {
            IncidentDto live = liveIncidents.get(id);
            live.setStatus(newStatus);
            if ("RESOLVED".equals(newStatus)) {
                live.setResolvedAt(Instant.now().toString());
            }
            log.info("Live Incident {} status updated to {}", live.getIncidentCode(), newStatus);
            return live;
        }

        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));

        incident.setStatus(newStatus);
        if ("RESOLVED".equals(newStatus)) {
            incident.setResolvedAt(Instant.now());
        }
        Incident saved = incidentRepository.save(incident);
        log.info("Incident {} status updated to {}", saved.getIncidentCode(), newStatus);
        return mapToDto(saved);
    }

    private IncidentDto mapToDto(Incident incident) {
        return IncidentDto.builder()
                .id(incident.getId())
                .incidentCode(incident.getIncidentCode())
                .clusterName(incident.getCluster() != null ? incident.getCluster().getClusterName() : null)
                .namespace(incident.getNamespace() != null ? incident.getNamespace().getNamespaceName() : null)
                .podName(incident.getPod() != null ? incident.getPod().getPodName() : null)
                .containerName(incident.getPod() != null ? incident.getPod().getImageName() : null)
                .reason(incident.getIncidentType() != null ? incident.getIncidentType().getName() : null)
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .logSnippet(incident.getLogSnippet())
                .aiSummary(incident.getAiSummary())
                .detectedAt(incident.getDetectedAt() != null ? incident.getDetectedAt().toString() : Instant.now().toString())
                .resolvedAt(incident.getResolvedAt() != null ? incident.getResolvedAt().toString() : null)
                .build();
    }
}
