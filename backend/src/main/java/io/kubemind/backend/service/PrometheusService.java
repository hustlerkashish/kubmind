package io.kubemind.backend.service;

import io.kubemind.backend.dto.metrics.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
@Slf4j
public class PrometheusService {

    @Value("${app.prometheus.url:http://prometheus-server:80}")
    private String prometheusUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    // ─────────────────────────────────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────────────────────────────────

    public PrometheusQueryResultDto getCpuMetrics(String range) {
        return executePrometheusQuery("CPU Load",
                "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
                "%", range);
    }

    public PrometheusQueryResultDto getMemoryMetrics(String range) {
        return executePrometheusQuery("Memory Usage",
                "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
                "%", range);
    }

    public PrometheusQueryResultDto getNetworkMetrics(String range) {
        return executePrometheusQuery("Network RX/TX",
                "sum(rate(node_network_receive_bytes_total[5m]))",
                "MB/s", range);
    }

    public PrometheusQueryResultDto getDiskMetrics(String range) {
        return executePrometheusQuery("Disk Usage",
                "(1 - (node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"})) * 100",
                "%", range);
    }

    public PrometheusQueryResultDto getPodMetrics(String range) {
        return executePrometheusQuery("Pod CPU",
                "sum(rate(container_cpu_usage_seconds_total{container!=\"\"}[5m])) by (pod)",
                "%", range);
    }

    public PrometheusQueryResultDto getNodeMetrics(String range) {
        return executePrometheusQuery("Node Load",
                "node_load1",
                "load", range);
    }

    public List<GrafanaEmbedDto> getGrafanaPanels() {
        return List.of(
                GrafanaEmbedDto.builder()
                        .title("Kubernetes Cluster Compute Load")
                        .panelId("panel-1")
                        .dashboardUid("k8s-compute-overview")
                        .embedUrl(prometheusUrl.replace("9090", "3000") + "/d-solo/k8s-compute/overview?panelId=1&theme=dark")
                        .description("Real-time CPU & Memory overview")
                        .build()
        );
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Summary stats for dashboard cards
    // ─────────────────────────────────────────────────────────────────────────

    public Map<String, Object> getDashboardSummary() {
        Map<String, Object> summary = new LinkedHashMap<>();
        try {
            double cpu = querySingleValue(
                    "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)");
            double memory = querySingleValue(
                    "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100");
            double network = querySingleValue(
                    "sum(rate(node_network_receive_bytes_total[5m]))");
            double disk = querySingleValue(
                    "(1 - (node_filesystem_avail_bytes{mountpoint=\"/\"} / node_filesystem_size_bytes{mountpoint=\"/\"})) * 100");

            summary.put("cpuPercent", Math.round(cpu * 10.0) / 10.0);
            summary.put("memoryPercent", Math.round(memory * 10.0) / 10.0);
            summary.put("networkMBps", Math.round(network / 1024 / 1024 * 10.0) / 10.0);
            summary.put("diskPercent", Math.round(disk * 10.0) / 10.0);
            summary.put("livePrometheusConnected", true);
            log.info("Dashboard summary fetched from live Prometheus: cpu={}%, mem={}%", cpu, memory);
        } catch (Exception e) {
            log.warn("Prometheus unreachable for dashboard summary: {}", e.getMessage());
            summary.put("cpuPercent", null);
            summary.put("memoryPercent", null);
            summary.put("networkMBps", null);
            summary.put("diskPercent", null);
            summary.put("livePrometheusConnected", false);
        }
        return summary;
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal Prometheus query helpers
    // ─────────────────────────────────────────────────────────────────────────

    private double querySingleValue(String promql) {
        String url = UriComponentsBuilder
                .fromHttpUrl(prometheusUrl + "/api/v1/query")
                .queryParam("query", promql)
                .toUriString();

        @SuppressWarnings("unchecked")
        Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
        if (resp == null) throw new RuntimeException("Null response from Prometheus");

        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) resp.get("data");
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> result = (List<Map<String, Object>>) data.get("result");

        if (result == null || result.isEmpty()) return 0.0;

        @SuppressWarnings("unchecked")
        List<Object> value = (List<Object>) result.get(0).get("value");
        return Double.parseDouble(value.get(1).toString());
    }

    private PrometheusQueryResultDto executePrometheusQuery(String metricName, String promql,
                                                            String unit, String range) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(prometheusUrl + "/api/v1/query")
                    .queryParam("query", promql)
                    .toUriString();

            log.debug("Executing PromQL: {}", url);

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(url, Map.class);

            if (resp != null && "success".equals(resp.get("status"))) {
                @SuppressWarnings("unchecked")
                Map<String, Object> data = (Map<String, Object>) resp.get("data");
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> results = (List<Map<String, Object>>) data.get("result");

                List<MetricSeriesDto> series = new ArrayList<>();
                for (Map<String, Object> r : results) {
                    @SuppressWarnings("unchecked")
                    Map<String, String> metric = (Map<String, String>) r.get("metric");
                    @SuppressWarnings("unchecked")
                    List<Object> val = (List<Object>) r.get("value");

                    String target = metric.isEmpty() ? "cluster" :
                            metric.getOrDefault("pod", metric.getOrDefault("instance", "node"));
                    double numVal = Double.parseDouble(val.get(1).toString());
                    numVal = Math.round(numVal * 100.0) / 100.0;

                    List<MetricDatapointDto> datapoints = new ArrayList<>();
                    datapoints.add(MetricDatapointDto.builder()
                            .timestamp(String.valueOf(val.get(0)))
                            .value(numVal)
                            .build());

                    series.add(MetricSeriesDto.builder()
                            .metricName(metricName)
                            .target(target)
                            .unit(unit)
                            .datapoints(datapoints)
                            .build());
                }

                return PrometheusQueryResultDto.builder()
                        .queryType(metricName)
                        .range(range != null ? range : "1h")
                        .livePrometheusConnected(true)
                        .series(series)
                        .build();
            }
        } catch (Exception ex) {
            log.debug("Prometheus live query failed for '{}': {}", metricName, ex.getMessage());
        }

        return PrometheusQueryResultDto.builder()
                .queryType(metricName)
                .range(range != null ? range : "1h")
                .livePrometheusConnected(false)
                .series(Collections.emptyList())
                .build();
    }
}
