package io.kubemind.backend.service;

import io.kubemind.backend.dto.metrics.*;
import io.kubemind.backend.security.SsrfValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.*;

@Service
@Slf4j
public class PrometheusService {

    @Value("${app.prometheus.url:http://prometheus:9090}")
    private String prometheusUrl;

    @Autowired(required = false)
    private Environment environment;

    private final RestTemplate restTemplate = createSafeRestTemplate();

    private static RestTemplate createSafeRestTemplate() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory() {
                    @Override
                    protected void prepareConnection(java.net.HttpURLConnection connection, String httpMethod) throws java.io.IOException {
                        super.prepareConnection(connection, httpMethod);
                        connection.setInstanceFollowRedirects(false);
                    }
                };
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(10000);
        return new RestTemplate(factory);
    }

    private boolean isProduction() {
        if (environment == null) return false;
        for (String profile : environment.getActiveProfiles()) {
            if (profile != null) {
                String p = profile.trim().toLowerCase();
                if ("prod".equals(p) || "production".equals(p)) return true;
            }
        }
        return false;
    }

    private String resolveUrl(String override) {
        if (isProduction()) {
            return (prometheusUrl != null && !prometheusUrl.isBlank()) ? prometheusUrl : "http://prometheus:9090";
        }

        if (override != null && !override.isBlank()) {
            if (!SsrfValidator.isSafeUrl(override)) {
                log.warn("SSRF protection: Rejected untrusted Prometheus URL override: {}", override);
                return (prometheusUrl != null && !prometheusUrl.isBlank()) ? prometheusUrl : "http://prometheus:9090";
            }
            String url = override.replaceAll("/+$", "");
            if (url.contains("localhost")) {
                url = url.replace("localhost", "host.docker.internal");
            } else if (url.contains("127.0.0.1")) {
                url = url.replace("127.0.0.1", "host.docker.internal");
            }
            return url;
        }
        return (prometheusUrl != null && !prometheusUrl.isBlank()) ? prometheusUrl : "http://prometheus:9090";
    }

    public PrometheusQueryResultDto getCpuMetrics(String range) {
        return getCpuMetrics(range, null);
    }

    public PrometheusQueryResultDto getCpuMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("CPU Load",
                "100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
                "%", range, promUrlOverride);
    }

    public PrometheusQueryResultDto getMemoryMetrics(String range) {
        return getMemoryMetrics(range, null);
    }

    public PrometheusQueryResultDto getMemoryMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("Memory Usage",
                "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
                "%", range, promUrlOverride);
    }

    public PrometheusQueryResultDto getNetworkMetrics(String range) {
        return getNetworkMetrics(range, null);
    }

    public PrometheusQueryResultDto getNetworkMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("Network RX/TX",
                "(sum(rate(node_network_receive_bytes_total{device!=\"lo\"}[5m])) + sum(rate(node_network_transmit_bytes_total{device!=\"lo\"}[5m]))) / 1048576",
                "MB/s", range, promUrlOverride);
    }

    public PrometheusQueryResultDto getDiskMetrics(String range) {
        return getDiskMetrics(range, null);
    }

    public PrometheusQueryResultDto getDiskMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("Disk Usage",
                "(1 - (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"})) * 100",
                "%", range, promUrlOverride);
    }

    public PrometheusQueryResultDto getPodMetrics(String range) {
        return getPodMetrics(range, null);
    }

    public PrometheusQueryResultDto getPodMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("Pod CPU",
                "sum(rate(container_cpu_usage_seconds_total{container!=\"\"}[5m])) by (pod)",
                "%", range, promUrlOverride);
    }

    public PrometheusQueryResultDto getNodeMetrics(String range) {
        return getNodeMetrics(range, null);
    }

    public PrometheusQueryResultDto getNodeMetrics(String range, String promUrlOverride) {
        return executePrometheusQuery("Node Load",
                "node_load1",
                "load", range, promUrlOverride);
    }

    public List<GrafanaEmbedDto> getGrafanaPanels() {
        return getGrafanaPanels(null);
    }

    public List<GrafanaEmbedDto> getGrafanaPanels(String promUrlOverride) {
        String activeUrl = resolveUrl(promUrlOverride);
        return List.of(
                GrafanaEmbedDto.builder()
                        .title("Kubernetes Cluster Compute Load")
                        .panelId("panel-1")
                        .dashboardUid("k8s-compute-overview")
                        .embedUrl(activeUrl.replace("9090", "3000") + "/d-solo/k8s-compute/overview?panelId=1&theme=dark")
                        .description("Real-time CPU & Memory overview")
                        .build()
        );
    }

    public Map<String, Object> getDashboardSummary() {
        return getDashboardSummary(null);
    }

    public Map<String, Object> getDashboardSummary(String promUrlOverride) {
        Map<String, Object> summary = new LinkedHashMap<>();
        String activeUrl = resolveUrl(promUrlOverride);
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(activeUrl + "/api/v1/query")
                    .queryParam("query", "up")
                    .toUriString();

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
            if (resp != null && "success".equals(resp.get("status"))) {
                summary.put("livePrometheusConnected", true);

                Double cpu = tryQuerySingleValue("100 - (avg(rate(container_cpu_usage_seconds_total[5m])) * 100)", activeUrl);
                if (cpu == null) {
                    cpu = tryQuerySingleValue("100 - (avg(rate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)", activeUrl);
                }

                Double memory = tryQuerySingleValue("(sum(container_memory_working_set_bytes) / sum(machine_memory_bytes)) * 100", activeUrl);
                if (memory == null) {
                    memory = tryQuerySingleValue("(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", activeUrl);
                }

                Double network = tryQuerySingleValue(
                        "(sum(rate(node_network_receive_bytes_total{device!=\"lo\"}[5m])) + sum(rate(node_network_transmit_bytes_total{device!=\"lo\"}[5m]))) / 1048576",
                        activeUrl);
                Double disk = tryQuerySingleValue(
                        "avg((1 - (node_filesystem_avail_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"} / node_filesystem_size_bytes{mountpoint=\"/\",fstype!~\"tmpfs|overlay\"})) * 100)",
                        activeUrl);

                summary.put("cpuPercent", cpu != null ? Math.round(cpu * 10.0) / 10.0 : null);
                summary.put("memoryPercent", memory != null ? Math.round(memory * 10.0) / 10.0 : null);
                summary.put("networkMBps", network != null ? Math.round(network * 10000.0) / 10000.0 : null);
                summary.put("diskPercent", disk != null ? Math.round(disk * 10.0) / 10.0 : null);
                summary.put("livePrometheusConnected", true);
                summary.put("telemetryAvailable",
                        cpu != null || memory != null || network != null || disk != null);
                log.info("Prometheus API reachable at {}; live metric availability recorded separately", activeUrl);
            } else {
                summary.put("cpuPercent", null);
                summary.put("memoryPercent", null);
                summary.put("networkMBps", null);
                summary.put("diskPercent", null);
                summary.put("livePrometheusConnected", false);
                summary.put("telemetryAvailable", false);
            }
        } catch (Exception e) {
            log.warn("Prometheus ({}) is unavailable; live dashboard telemetry cannot be provided: {}", activeUrl, e.getMessage());
            summary.put("cpuPercent", null);
            summary.put("memoryPercent", null);
            summary.put("networkMBps", null);
            summary.put("diskPercent", null);
            summary.put("livePrometheusConnected", false);
            summary.put("telemetryAvailable", false);
        }
        return summary;
    }

    private Double tryQuerySingleValue(String promql, String activeUrl) {
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(activeUrl + "/api/v1/query")
                    .queryParam("query", promql)
                    .toUriString();

            @SuppressWarnings("unchecked")
            Map<String, Object> resp = restTemplate.getForObject(url, Map.class);
            if (resp == null) return null;

            @SuppressWarnings("unchecked")
            Map<String, Object> data = (Map<String, Object>) resp.get("data");
            if (data == null) return null;

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> result = (List<Map<String, Object>>) data.get("result");
            if (result == null || result.isEmpty()) return null;

            @SuppressWarnings("unchecked")
            List<Object> value = (List<Object>) result.get(0).get("value");
            return Double.parseDouble(value.get(1).toString());
        } catch (Exception e) {
            return null;
        }
    }

    private PrometheusQueryResultDto executePrometheusQuery(String metricName, String promql,
                                                             String unit, String range,
                                                             String promUrlOverride) {
        String activeUrl = resolveUrl(promUrlOverride);
        try {
            String url = UriComponentsBuilder
                    .fromHttpUrl(activeUrl + "/api/v1/query")
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

                if (results != null && !results.isEmpty()) {
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
            }
        } catch (Exception ex) {
            log.debug("Prometheus ({}) live query fallback for '{}': {}", activeUrl, metricName, ex.getMessage());
        }

        // Never present generated telemetry as live Prometheus data.
        return PrometheusQueryResultDto.builder()
                .queryType(metricName)
                .range(range != null ? range : "1h")
                .livePrometheusConnected(false)
                .series(List.of())
                .build();
    }


}
