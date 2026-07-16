package io.kubemind.backend.controller;

import io.kubemind.backend.service.GitHubService;
import io.kubemind.backend.service.GrafanaService;
import io.kubemind.backend.service.PrometheusService;
import io.kubemind.backend.service.KubernetesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/dashboard")
@RequiredArgsConstructor
@Slf4j
public class DashboardController {

    private final PrometheusService prometheusService;
    private final KubernetesService kubernetesService;
    private final GitHubService gitHubService;
    private final GrafanaService grafanaService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getDashboardSummary(
            @RequestHeader(value = "X-Target-Github-Token", required = false) String ghToken,
            @RequestHeader(value = "X-Target-Repos", required = false) String ghRepos
    ) {
        Map<String, Object> response = new LinkedHashMap<>();
        try {
            response.put("metrics", prometheusService.getDashboardSummary());

            try {
                response.put("cluster", kubernetesService.getClusterSummary());
            } catch (Exception e) {
                log.warn("Cluster summary unavailable: {}", e.getMessage());
                response.put("cluster", Map.of("status", "unavailable", "connected", false));
            }

            response.put("cicd", gitHubService.getCiCdSummary(ghToken, ghRepos));
            response.put("grafana", grafanaService.getSummary());

            response.put("timestamp", System.currentTimeMillis());
            response.put("success", true);

        } catch (Exception e) {
            log.error("Dashboard summary error: {}", e.getMessage());
            response.put("success", false);
            response.put("error", e.getMessage());
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/cicd/runs")
    public ResponseEntity<Map<String, Object>> getWorkflowRuns(
            @RequestHeader(value = "X-Target-Github-Token", required = false) String ghToken,
            @RequestHeader(value = "X-Target-Repos", required = false) String ghRepos
    ) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", gitHubService.getAllWorkflowRuns(ghToken, ghRepos)
        ));
    }

    @GetMapping("/cicd/deployments")
    public ResponseEntity<Map<String, Object>> getDeployments(
            @RequestHeader(value = "X-Target-Github-Token", required = false) String ghToken,
            @RequestHeader(value = "X-Target-Repos", required = false) String ghRepos
    ) {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", gitHubService.getAllDeployments(ghToken, ghRepos)
        ));
    }

    @GetMapping("/grafana/alerts")
    public ResponseEntity<Map<String, Object>> getGrafanaAlerts() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", grafanaService.getAlerts()
        ));
    }

    @GetMapping("/grafana/dashboards")
    public ResponseEntity<Map<String, Object>> getGrafanaDashboards() {
        return ResponseEntity.ok(Map.of(
                "success", true,
                "data", grafanaService.getDashboards()
        ));
    }
}
