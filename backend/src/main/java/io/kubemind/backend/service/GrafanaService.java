package io.kubemind.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GrafanaService {

    @Value("${grafana.url:}")
    private String grafanaUrl;

    @Value("${grafana.api-key:}")
    private String grafanaApiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    private String resolveUrl(String override) {
        String raw = (override != null && !override.isBlank()) ? override : grafanaUrl;
        if (raw == null || raw.isBlank()) return null;
        String url = raw.replaceAll("/+$", "");
        if (url.contains("localhost")) {
            url = url.replace("localhost", "host.docker.internal");
        } else if (url.contains("127.0.0.1")) {
            url = url.replace("127.0.0.1", "host.docker.internal");
        }
        return url;
    }

    public List<Map<String, Object>> getAlerts() {
        return getAlerts(null, null);
    }

    public List<Map<String, Object>> getAlerts(String urlOverride, String apiKeyOverride) {
        String activeUrl = resolveUrl(urlOverride);
        String activeKey = (apiKeyOverride != null && !apiKeyOverride.isBlank()) ? apiKeyOverride : grafanaApiKey;

        if (activeUrl == null || activeUrl.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String url = activeUrl + "/api/alerts?limit=20";
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, buildHeaders(activeKey), List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> alerts = response.getBody();
                return alerts.stream().map(a -> {
                    Map<String, Object> simplified = new LinkedHashMap<>();
                    simplified.put("id", a.get("id"));
                    simplified.put("name", a.get("name"));
                    simplified.put("state", a.get("state"));
                    simplified.put("dashboardUid", a.get("dashboardUid"));
                    simplified.put("panelId", a.get("panelId"));
                    simplified.put("newStateDate", a.get("newStateDate"));
                    simplified.put("url", activeUrl + "/d/" + a.get("dashboardUid"));
                    return simplified;
                }).toList();
            }
        } catch (Exception e) {
            log.debug("Grafana legacy /api/alerts failed for {}: {}", activeUrl, e.getMessage());
        }
        return Collections.emptyList();
    }

    public List<Map<String, Object>> getDashboards() {
        return getDashboards(null, null);
    }

    public List<Map<String, Object>> getDashboards(String urlOverride, String apiKeyOverride) {
        String activeUrl = resolveUrl(urlOverride);
        String activeKey = (apiKeyOverride != null && !apiKeyOverride.isBlank()) ? apiKeyOverride : grafanaApiKey;

        if (activeUrl == null || activeUrl.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String url = activeUrl + "/api/search?type=dash-db&limit=20";
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, buildHeaders(activeKey), List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> boards = response.getBody();
                return boards.stream().map(b -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("uid", b.get("uid"));
                    d.put("title", b.get("title"));
                    d.put("url", activeUrl + b.get("url"));
                    d.put("tags", b.get("tags"));
                    return d;
                }).toList();
            }
        } catch (Exception e) {
            log.debug("Failed to fetch Grafana dashboards from {}: {}", activeUrl, e.getMessage());
        }
        return Collections.emptyList();
    }

    public Map<String, Object> getSummary() {
        return getSummary(null, null);
    }

    public Map<String, Object> getSummary(String urlOverride, String apiKeyOverride) {
        String activeUrl = resolveUrl(urlOverride);
        String activeKey = (apiKeyOverride != null && !apiKeyOverride.isBlank()) ? apiKeyOverride : grafanaApiKey;
        boolean isConfigured = activeUrl != null && !activeUrl.isBlank();
        boolean connected = false;
        int firing = 0;
        int ok = 0;
        int total = 0;

        if (isConfigured) {
            try {
                String healthUrl = activeUrl + "/api/health";
                ResponseEntity<Map> healthResp = restTemplate.exchange(healthUrl, HttpMethod.GET, buildHeaders(activeKey), Map.class);
                if (healthResp.getStatusCode().is2xxSuccessful()) {
                    connected = true;
                }
            } catch (Exception e) {
                log.debug("Grafana health check failed for {}: {}", activeUrl, e.getMessage());
            }

            List<Map<String, Object>> alerts = getAlerts(urlOverride, apiKeyOverride);
            if (!alerts.isEmpty()) {
                connected = true;
                total = alerts.size();
                firing = (int) alerts.stream().filter(a -> "alerting".equals(a.get("state"))).count();
                ok = (int) alerts.stream().filter(a -> "ok".equals(a.get("state"))).count();
            }
        }

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAlerts", total);
        summary.put("firingAlerts", firing);
        summary.put("okAlerts", ok);
        summary.put("connected", connected);
        summary.put("grafanaUrl", connected ? activeUrl : null);
        return summary;
    }

    private HttpEntity<Void> buildHeaders(String apiKey) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        if (apiKey != null && !apiKey.isBlank()) {
            headers.set("Authorization", "Bearer " + apiKey);
        }
        return new HttpEntity<>(headers);
    }
}
