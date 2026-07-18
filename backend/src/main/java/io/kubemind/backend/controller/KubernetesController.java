package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.k8s.*;
import io.kubemind.backend.service.KubernetesService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/k8s")
@RequiredArgsConstructor
@Tag(name = "Kubernetes Engine API", description = "Live Kubernetes SDK telemetry queries for Pods, Logs, Deployments, Nodes, Services, Namespaces, Events & Clusters")
public class KubernetesController {

    private final KubernetesService kubernetesService;

    @GetMapping("/clusters")
    @Operation(summary = "Get active Kubernetes cluster summary & connection state")
    public ResponseEntity<ApiResponse<K8sClusterDto>> getClusterSummary(
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getClusterSummary(k8sUrl, k8sToken), "Cluster summary retrieved"));
    }

    @GetMapping("/pods")
    @Operation(summary = "List live Kubernetes pods (optional namespace filtering)")
    public ResponseEntity<ApiResponse<List<K8sPodDto>>> getPods(
            @RequestParam(required = false, defaultValue = "all") String namespace,
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getPods(namespace, k8sUrl, k8sToken), "Pods list retrieved"));
    }

    @GetMapping("/pods/{namespace}/{podName}/logs")
    @Operation(summary = "Read container stdout/stderr live log stream")
    public ResponseEntity<ApiResponse<PodLogResponseDto>> getPodLogs(
            @PathVariable String namespace,
            @PathVariable String podName,
            @RequestParam(required = false) String container,
            @RequestParam(required = false, defaultValue = "100") Integer tailLines,
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getPodLogs(namespace, podName, container, tailLines, k8sUrl, k8sToken), "Pod logs retrieved"));
    }

    @GetMapping("/deployments")
    @Operation(summary = "List live Kubernetes deployments")
    public ResponseEntity<ApiResponse<List<K8sDeploymentDto>>> getDeployments(
            @RequestParam(required = false, defaultValue = "all") String namespace,
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getDeployments(namespace, k8sUrl, k8sToken), "Deployments list retrieved"));
    }

    @GetMapping("/services")
    @Operation(summary = "List live Kubernetes services")
    public ResponseEntity<ApiResponse<List<K8sServiceDto>>> getServices(
            @RequestParam(required = false, defaultValue = "all") String namespace,
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getServices(namespace, k8sUrl, k8sToken), "Services list retrieved"));
    }

    @GetMapping("/nodes")
    @Operation(summary = "List active Kubernetes nodes and hardware specifications")
    public ResponseEntity<ApiResponse<List<K8sNodeDto>>> getNodes(
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getNodes(k8sUrl, k8sToken), "Nodes list retrieved"));
    }

    @GetMapping("/namespaces")
    @Operation(summary = "List all active Kubernetes namespaces")
    public ResponseEntity<ApiResponse<List<K8sNamespaceDto>>> getNamespaces(
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getNamespaces(k8sUrl, k8sToken), "Namespaces list retrieved"));
    }

    @GetMapping("/events")
    @Operation(summary = "List cluster events feed (warnings & normal operations)")
    public ResponseEntity<ApiResponse<List<K8sEventDto>>> getEvents(
            @RequestParam(required = false, defaultValue = "all") String namespace,
            @RequestHeader(value = "X-Target-K8s-Url", required = false) String k8sUrl,
            @RequestHeader(value = "X-Target-K8s-Token", required = false) String k8sToken
    ) {
        return ResponseEntity.ok(ApiResponse.success(kubernetesService.getEvents(namespace, k8sUrl, k8sToken), "Events feed retrieved"));
    }
}
