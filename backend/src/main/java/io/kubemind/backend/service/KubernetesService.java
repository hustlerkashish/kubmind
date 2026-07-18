package io.kubemind.backend.service;

import io.kubernetes.client.openapi.ApiClient;
import io.kubernetes.client.openapi.apis.AppsV1Api;
import io.kubernetes.client.openapi.apis.CoreV1Api;
import io.kubernetes.client.openapi.apis.VersionApi;
import io.kubernetes.client.openapi.models.*;
import io.kubemind.backend.dto.k8s.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class KubernetesService {

    private final ApiClient defaultApiClient;

    private ApiClient getApiClient(String urlOverride, String tokenOverride) {
        if (urlOverride != null && !urlOverride.isBlank()) {
            try {
                String url = urlOverride.replaceAll("/+$", "");
                if (url.contains("localhost")) {
                    url = url.replace("localhost", "host.docker.internal");
                } else if (url.contains("127.0.0.1")) {
                    url = url.replace("127.0.0.1", "host.docker.internal");
                }
                ApiClient client = new ApiClient();
                client.setBasePath(url);
                client.setVerifyingSsl(false);
                if (tokenOverride != null && !tokenOverride.isBlank()) {
                    client.setApiKeyPrefix("Bearer");
                    client.setApiKey(tokenOverride);
                }
                return client;
            } catch (Exception e) {
                log.warn("Failed to build dynamic K8s ApiClient for URL {}: {}", urlOverride, e.getMessage());
            }
        }
        return defaultApiClient;
    }

    public PodLogResponseDto getPodLogs(String namespace, String podName, String container, Integer tailLines) {
        return getPodLogs(namespace, podName, container, tailLines, null, null);
    }

    public PodLogResponseDto getPodLogs(String namespace, String podName, String container, Integer tailLines, String urlOverride, String tokenOverride) {
        int lines = (tailLines != null && tailLines > 0) ? tailLines : 100;
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            String logsRaw = coreV1Api.readNamespacedPodLog(podName, namespace)
                    .container(container)
                    .tailLines(lines)
                    .execute();

            List<String> logLines = List.of(logsRaw.split("\n"));
            return PodLogResponseDto.builder()
                    .podName(podName)
                    .namespace(namespace)
                    .containerName(container != null ? container : "default")
                    .tailLines(lines)
                    .logs(logLines)
                    .build();

        } catch (Exception ex) {
            log.warn("Error fetching live pod logs from K8s API: {}", ex.getMessage());
            return PodLogResponseDto.builder()
                    .podName(podName)
                    .namespace(namespace)
                    .containerName(container != null ? container : "main")
                    .tailLines(lines)
                    .logs(List.of("[NO DATA] Unable to fetch live pod logs — Kubernetes cluster unreachable or pod not found."))
                    .build();
        }
    }

    public K8sClusterDto getClusterSummary() {
        return getClusterSummary(null, null);
    }

    public K8sClusterDto getClusterSummary(String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);

            int totalNodes = 0;
            int totalPods = 0;
            boolean connected = false;

            try {
                V1NodeList nodes = coreV1Api.listNode().execute();
                if (nodes != null && nodes.getItems() != null) {
                    totalNodes = nodes.getItems().size();
                    connected = true;
                }
            } catch (Exception ne) {
                log.debug("listNode exception: {}", ne.getMessage());
            }

            try {
                V1PodList pods = coreV1Api.listPodForAllNamespaces().execute();
                if (pods != null && pods.getItems() != null) {
                    totalPods = pods.getItems().size();
                    connected = true;
                }
            } catch (Exception pe) {
                log.debug("listPod exception: {}", pe.getMessage());
            }

            if (!connected) {
                try {
                    V1NamespaceList ns = coreV1Api.listNamespace().execute();
                    if (ns != null && ns.getItems() != null) {
                        connected = true;
                    }
                } catch (Exception nse) {
                    log.debug("listNamespace exception: {}", nse.getMessage());
                }
            }

            return K8sClusterDto.builder()
                    .clusterName(connected ? "kubernetes-cluster" : "Disconnected Cluster")
                    .serverUrl(client.getBasePath())
                    .currentContext("active-context")
                    .kubernetesVersion("v1.30.0")
                    .status(connected ? "Online" : "Disconnected")
                    .connected(connected)
                    .totalNodes(totalNodes)
                    .totalPods(totalPods)
                    .build();

        } catch (Exception ex) {
            log.warn("Cluster telemetry fetch failed: {}", ex.getMessage());
            return K8sClusterDto.builder()
                    .clusterName("Disconnected Cluster")
                    .serverUrl(urlOverride != null ? urlOverride : defaultApiClient.getBasePath())
                    .currentContext("N/A")
                    .kubernetesVersion("N/A")
                    .status("Disconnected")
                    .connected(false)
                    .totalNodes(0)
                    .totalPods(0)
                    .build();
        }
    }

    public List<K8sPodDto> getPods(String namespace) {
        return getPods(namespace, null, null);
    }

    public List<K8sPodDto> getPods(String namespace, String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            V1PodList podList;
            if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                podList = coreV1Api.listNamespacedPod(namespace).execute();
            } else {
                podList = coreV1Api.listPodForAllNamespaces().execute();
            }

            if (podList.getItems() == null) return List.of();

            return podList.getItems().stream().map(pod -> {
                int totalRestarts = 0;
                if (pod.getStatus() != null && pod.getStatus().getContainerStatuses() != null) {
                    totalRestarts = pod.getStatus().getContainerStatuses().stream()
                            .mapToInt(V1ContainerStatus::getRestartCount)
                            .sum();
                }

                String containerNames = "";
                if (pod.getSpec() != null && pod.getSpec().getContainers() != null) {
                    containerNames = pod.getSpec().getContainers().stream()
                            .map(V1Container::getName)
                            .collect(Collectors.joining(", "));
                }

                return K8sPodDto.builder()
                        .name(pod.getMetadata() != null ? pod.getMetadata().getName() : "unknown")
                        .namespace(pod.getMetadata() != null ? pod.getMetadata().getNamespace() : "default")
                        .status(pod.getStatus() != null ? pod.getStatus().getPhase() : "Unknown")
                        .podIP(pod.getStatus() != null ? pod.getStatus().getPodIP() : "N/A")
                        .hostIP(pod.getStatus() != null ? pod.getStatus().getHostIP() : "N/A")
                        .nodeName(pod.getSpec() != null ? pod.getSpec().getNodeName() : "N/A")
                        .restartCount(totalRestarts)
                        .creationTimestamp(pod.getMetadata() != null && pod.getMetadata().getCreationTimestamp() != null
                                ? pod.getMetadata().getCreationTimestamp().toString() : "N/A")
                        .containers(containerNames)
                        .build();
            }).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching pods from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<K8sDeploymentDto> getDeployments(String namespace) {
        return getDeployments(namespace, null, null);
    }

    public List<K8sDeploymentDto> getDeployments(String namespace, String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            AppsV1Api appsApi = new AppsV1Api(client);
            V1DeploymentList deploymentList;
            if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                deploymentList = appsApi.listNamespacedDeployment(namespace).execute();
            } else {
                deploymentList = appsApi.listDeploymentForAllNamespaces().execute();
            }

            if (deploymentList.getItems() == null) return List.of();

            return deploymentList.getItems().stream().map(dep -> {
                int desired = dep.getSpec() != null && dep.getSpec().getReplicas() != null ? dep.getSpec().getReplicas() : 0;
                int available = dep.getStatus() != null && dep.getStatus().getAvailableReplicas() != null ? dep.getStatus().getAvailableReplicas() : 0;
                int updated = dep.getStatus() != null && dep.getStatus().getUpdatedReplicas() != null ? dep.getStatus().getUpdatedReplicas() : 0;

                String image = "N/A";
                if (dep.getSpec() != null && dep.getSpec().getTemplate() != null &&
                        dep.getSpec().getTemplate().getSpec() != null &&
                        dep.getSpec().getTemplate().getSpec().getContainers() != null &&
                        !dep.getSpec().getTemplate().getSpec().getContainers().isEmpty()) {
                    image = dep.getSpec().getTemplate().getSpec().getContainers().getFirst().getImage();
                }

                String status = (desired == available && desired > 0) ? "HEALTHY" : "DEGRADED";

                return K8sDeploymentDto.builder()
                        .name(dep.getMetadata() != null ? dep.getMetadata().getName() : "unknown")
                        .namespace(dep.getMetadata() != null ? dep.getMetadata().getNamespace() : "default")
                        .desiredReplicas(desired)
                        .availableReplicas(available)
                        .updatedReplicas(updated)
                        .status(status)
                        .image(image)
                        .creationTimestamp(dep.getMetadata() != null && dep.getMetadata().getCreationTimestamp() != null
                                ? dep.getMetadata().getCreationTimestamp().toString() : "N/A")
                        .build();
            }).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching deployments from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<K8sServiceDto> getServices(String namespace) {
        return getServices(namespace, null, null);
    }

    public List<K8sServiceDto> getServices(String namespace, String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            V1ServiceList serviceList;
            if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                serviceList = coreV1Api.listNamespacedService(namespace).execute();
            } else {
                serviceList = coreV1Api.listServiceForAllNamespaces().execute();
            }

            if (serviceList.getItems() == null) return List.of();

            return serviceList.getItems().stream().map(svc -> {
                String type = svc.getSpec() != null ? svc.getSpec().getType() : "ClusterIP";
                String clusterIP = svc.getSpec() != null ? svc.getSpec().getClusterIP() : "None";

                String ports = "N/A";
                if (svc.getSpec() != null && svc.getSpec().getPorts() != null) {
                    ports = svc.getSpec().getPorts().stream()
                            .map(p -> p.getPort() + ":" + p.getTargetPort() + "/" + p.getProtocol())
                            .collect(Collectors.joining(", "));
                }

                return K8sServiceDto.builder()
                        .name(svc.getMetadata() != null ? svc.getMetadata().getName() : "unknown")
                        .namespace(svc.getMetadata() != null ? svc.getMetadata().getNamespace() : "default")
                        .type(type)
                        .clusterIP(clusterIP)
                        .externalIP("None")
                        .ports(ports)
                        .creationTimestamp(svc.getMetadata() != null && svc.getMetadata().getCreationTimestamp() != null
                                ? svc.getMetadata().getCreationTimestamp().toString() : "N/A")
                        .build();
            }).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching services from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<K8sNodeDto> getNodes() {
        return getNodes(null, null);
    }

    public List<K8sNodeDto> getNodes(String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            V1NodeList nodeList = coreV1Api.listNode().execute();

            if (nodeList.getItems() == null) return List.of();

            return nodeList.getItems().stream().map(node -> {
                String role = "Worker Node";
                if (node.getMetadata() != null && node.getMetadata().getLabels() != null &&
                        node.getMetadata().getLabels().containsKey("node-role.kubernetes.io/control-plane")) {
                    role = "Control Plane";
                }

                String status = "NotReady";
                if (node.getStatus() != null && node.getStatus().getConditions() != null) {
                    for (V1NodeCondition cond : node.getStatus().getConditions()) {
                        if ("Ready".equalsIgnoreCase(cond.getType()) && "True".equalsIgnoreCase(cond.getStatus())) {
                            status = "Ready";
                            break;
                        }
                    }
                }

                String kubeletVersion = "N/A";
                if (node.getStatus() != null && node.getStatus().getNodeInfo() != null) {
                    kubeletVersion = node.getStatus().getNodeInfo().getKubeletVersion();
                }

                String cpu = "N/A";
                String mem = "N/A";
                if (node.getStatus() != null && node.getStatus().getCapacity() != null) {
                    cpu = node.getStatus().getCapacity().get("cpu") != null ? node.getStatus().getCapacity().get("cpu").toSuffixedString() : "N/A";
                    mem = node.getStatus().getCapacity().get("memory") != null ? node.getStatus().getCapacity().get("memory").toSuffixedString() : "N/A";
                }

                return K8sNodeDto.builder()
                        .name(node.getMetadata() != null ? node.getMetadata().getName() : "unknown")
                        .status(status)
                        .role(role)
                        .kubeletVersion(kubeletVersion)
                        .internalIP("192.168.49.2")
                        .cpuCapacity(cpu)
                        .memoryCapacity(mem)
                        .creationTimestamp(node.getMetadata() != null && node.getMetadata().getCreationTimestamp() != null
                                ? node.getMetadata().getCreationTimestamp().toString() : "N/A")
                        .build();
            }).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching nodes from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<K8sNamespaceDto> getNamespaces() {
        return getNamespaces(null, null);
    }

    public List<K8sNamespaceDto> getNamespaces(String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            V1NamespaceList nsList = coreV1Api.listNamespace().execute();

            if (nsList.getItems() == null) return List.of();

            return nsList.getItems().stream().map(ns -> K8sNamespaceDto.builder()
                    .name(ns.getMetadata() != null ? ns.getMetadata().getName() : "unknown")
                    .status(ns.getStatus() != null ? ns.getStatus().getPhase() : "Active")
                    .creationTimestamp(ns.getMetadata() != null && ns.getMetadata().getCreationTimestamp() != null
                            ? ns.getMetadata().getCreationTimestamp().toString() : "N/A")
                    .build()).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching namespaces from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<K8sEventDto> getEvents(String namespace) {
        return getEvents(namespace, null, null);
    }

    public List<K8sEventDto> getEvents(String namespace, String urlOverride, String tokenOverride) {
        try {
            ApiClient client = getApiClient(urlOverride, tokenOverride);
            CoreV1Api coreV1Api = new CoreV1Api(client);
            CoreV1EventList eventList;
            if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                eventList = coreV1Api.listNamespacedEvent(namespace).execute();
            } else {
                eventList = coreV1Api.listEventForAllNamespaces().execute();
            }

            if (eventList.getItems() == null) return List.of();

            return eventList.getItems().stream().map(evt -> K8sEventDto.builder()
                    .id(evt.getMetadata() != null ? evt.getMetadata().getUid() : "evt-0")
                    .type(evt.getType() != null ? evt.getType() : "Normal")
                    .reason(evt.getReason() != null ? evt.getReason() : "Event")
                    .message(evt.getMessage() != null ? evt.getMessage() : "Cluster operation logged")
                    .involvedObject(evt.getInvolvedObject() != null ? evt.getInvolvedObject().getKind() + "/" + evt.getInvolvedObject().getName() : "Cluster")
                    .namespace(evt.getMetadata() != null ? evt.getMetadata().getNamespace() : "default")
                    .count(evt.getCount() != null ? String.valueOf(evt.getCount()) : "1")
                    .lastTimestamp(evt.getLastTimestamp() != null ? evt.getLastTimestamp().toString() : "Just now")
                    .build()).collect(Collectors.toList());

        } catch (Exception ex) {
            log.warn("Error fetching events from K8s API: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }
}
