package io.kubemind.backend.service;

import io.kubemind.backend.dto.incidents.IncidentDto;
import io.kubemind.backend.dto.incidents.UpdateIncidentStatusRequest;
import io.kubemind.backend.entity.Incident;
import io.kubemind.backend.exception.ResourceNotFoundException;
import io.kubemind.backend.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class IncidentService {

    private final IncidentRepository incidentRepository;

    @Transactional(readOnly = true)
    public List<IncidentDto> getAllIncidents(String status, String namespace) {
        try {
            List<Incident> incidents = incidentRepository.findAll();

            if (incidents != null && !incidents.isEmpty()) {
                if (status != null && !status.isBlank() && !status.equalsIgnoreCase("all")) {
                    incidents = incidents.stream()
                            .filter(i -> i.getStatus().equalsIgnoreCase(status))
                            .collect(Collectors.toList());
                }

                if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                    incidents = incidents.stream()
                            .filter(i -> i.getNamespace().equalsIgnoreCase(namespace))
                            .collect(Collectors.toList());
                }

                return incidents.stream().map(this::mapToDto).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Error fetching incidents from database: {}", ex.getMessage());
        }

        return Collections.emptyList();
    }

    @Transactional(readOnly = true)
    public IncidentDto getIncidentById(UUID id) {
        return incidentRepository.findById(id)
                .map(this::mapToDto)
                .orElseThrow(() -> new ResourceNotFoundException("Incident", "id", id));
    }

    @Transactional
    public IncidentDto updateIncidentStatus(UUID id, UpdateIncidentStatusRequest request) {
        String newStatus = request.getStatus().toUpperCase();

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
                .clusterName(incident.getClusterName())
                .namespace(incident.getNamespace())
                .podName(incident.getPodName())
                .containerName(incident.getContainerName())
                .reason(incident.getReason())
                .severity(incident.getSeverity())
                .status(incident.getStatus())
                .logSnippet(incident.getLogSnippet())
                .aiSummary(incident.getAiSummary())
                .detectedAt(incident.getDetectedAt() != null ? incident.getDetectedAt().toString() : Instant.now().toString())
                .resolvedAt(incident.getResolvedAt() != null ? incident.getResolvedAt().toString() : null)
                .build();
    }
}
