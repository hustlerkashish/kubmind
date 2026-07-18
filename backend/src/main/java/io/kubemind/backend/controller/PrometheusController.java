package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.metrics.GrafanaEmbedDto;
import io.kubemind.backend.dto.metrics.PrometheusQueryResultDto;
import io.kubemind.backend.service.PrometheusService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/metrics")
@RequiredArgsConstructor
@Tag(name = "Prometheus Metrics API", description = "Live PromQL queries for CPU, Memory, Network, Disk, Pods, Nodes & Grafana Embeds")
public class PrometheusController {

    private final PrometheusService prometheusService;

    @GetMapping("/cpu")
    @Operation(summary = "Query PromQL CPU utilization time-series metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getCpuMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getCpuMetrics(range, promUrl), "CPU metrics retrieved"));
    }

    @GetMapping("/memory")
    @Operation(summary = "Query PromQL Memory allocation time-series metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getMemoryMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getMemoryMetrics(range, promUrl), "Memory metrics retrieved"));
    }

    @GetMapping("/network")
    @Operation(summary = "Query PromQL Network RX/TX throughput metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getNetworkMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getNetworkMetrics(range, promUrl), "Network throughput metrics retrieved"));
    }

    @GetMapping("/disk")
    @Operation(summary = "Query PromQL Disk storage I/O metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getDiskMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getDiskMetrics(range, promUrl), "Disk storage metrics retrieved"));
    }

    @GetMapping("/pods")
    @Operation(summary = "Query PromQL Pod level resource metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getPodMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getPodMetrics(range, promUrl), "Pod metrics retrieved"));
    }

    @GetMapping("/nodes")
    @Operation(summary = "Query PromQL Node level capacity metrics")
    public ResponseEntity<ApiResponse<PrometheusQueryResultDto>> getNodeMetrics(
            @RequestParam(required = false, defaultValue = "1h") String range,
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getNodeMetrics(range, promUrl), "Node metrics retrieved"));
    }

    @GetMapping("/grafana-embed")
    @Operation(summary = "Get Grafana dashboard panel embed iframe URLs & configurations")
    public ResponseEntity<ApiResponse<List<GrafanaEmbedDto>>> getGrafanaPanels(
            @RequestHeader(value = "X-Target-Prometheus-Url", required = false) String promUrl
    ) {
        return ResponseEntity.ok(ApiResponse.success(prometheusService.getGrafanaPanels(promUrl), "Grafana embed configurations retrieved"));
    }
}
