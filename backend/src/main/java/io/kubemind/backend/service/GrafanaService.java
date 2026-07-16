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

    public List<Map<String, Object>> getAlerts() {
        if (grafanaUrl == null || grafanaUrl.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String url = grafanaUrl + "/api/alerts?limit=20";
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, buildHeaders(), List.class);
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
                    simplified.put("url", grafanaUrl + "/d/" + a.get("dashboardUid"));
                    return simplified;
                }).toList();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Grafana alerts: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public List<Map<String, Object>> getDashboards() {
        if (grafanaUrl == null || grafanaUrl.isBlank()) {
            return Collections.emptyList();
        }
        try {
            String url = grafanaUrl + "/api/search?type=dash-db&limit=20";
            ResponseEntity<List> response = restTemplate.exchange(
                    url, HttpMethod.GET, buildHeaders(), List.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> boards = response.getBody();
                return boards.stream().map(b -> {
                    Map<String, Object> d = new LinkedHashMap<>();
                    d.put("uid", b.get("uid"));
                    d.put("title", b.get("title"));
                    d.put("url", grafanaUrl + b.get("url"));
                    d.put("tags", b.get("tags"));
                    return d;
                }).toList();
            }
        } catch (Exception e) {
            log.warn("Failed to fetch Grafana dashboards: {}", e.getMessage());
        }
        return Collections.emptyList();
    }

    public Map<String, Object> getSummary() {
        boolean isConfigured = grafanaUrl != null && !grafanaUrl.isBlank();
        List<Map<String, Object>> alerts = getAlerts();
        long firing = alerts.stream().filter(a -> "alerting".equals(a.get("state"))).count();
        long ok = alerts.stream().filter(a -> "ok".equals(a.get("state"))).count();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalAlerts", alerts.size());
        summary.put("firingAlerts", firing);
        summary.put("okAlerts", ok);
        summary.put("connected", isConfigured);
        summary.put("grafanaUrl", isConfigured ? grafanaUrl : null);
        return summary;
    }

    private HttpEntity<Void> buildHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Content-Type", "application/json");
        if (grafanaApiKey != null && !grafanaApiKey.isBlank()) {
            headers.set("Authorization", "Bearer " + grafanaApiKey);
        }
        return new HttpEntity<>(headers);
    }
}
