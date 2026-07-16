package io.kubemind.backend.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@Service
@Slf4j
public class GitHubService {

    @Value("${github.token:}")
    private String githubToken;

    @Value("${github.repos:}")
    private String githubRepos;

    private final RestTemplate restTemplate = new RestTemplate();
    private static final String GITHUB_API = "https://api.github.com";

    public List<Map<String, Object>> getAllWorkflowRuns() {
        return getAllWorkflowRuns(null, null);
    }

    public List<Map<String, Object>> getAllWorkflowRuns(String tokenOverride, String reposOverride) {
        String activeToken = (tokenOverride != null && !tokenOverride.isBlank()) ? tokenOverride : githubToken;
        String activeRepos = (reposOverride != null && !reposOverride.isBlank()) ? reposOverride : githubRepos;

        List<Map<String, Object>> allRuns = new ArrayList<>();

        if (activeToken == null || activeToken.isBlank() || activeRepos == null || activeRepos.isBlank()) {
            return Collections.emptyList();
        }

        for (String repo : activeRepos.split(",")) {
            repo = repo.trim();
            if (repo.isEmpty()) continue;
            try {
                String url = GITHUB_API + "/repos/" + repo + "/actions/runs?per_page=10";
                ResponseEntity<Map> response = restTemplate.exchange(
                        url, HttpMethod.GET, buildHeaders(activeToken), Map.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> runs = (List<Map<String, Object>>) response.getBody().get("workflow_runs");
                    if (runs != null) {
                        for (Map<String, Object> run : runs) {
                            Map<String, Object> simplified = new LinkedHashMap<>();
                            simplified.put("id", run.get("id"));
                            simplified.put("repo", repo);
                            simplified.put("name", run.get("name"));
                            simplified.put("status", run.get("status"));
                            simplified.put("conclusion", run.get("conclusion"));
                            simplified.put("branch", run.get("head_branch"));
                            simplified.put("commitSha", String.valueOf(run.get("head_sha")).substring(0, Math.min(7, String.valueOf(run.get("head_sha")).length())));
                            simplified.put("actor", ((Map<?, ?>) run.getOrDefault("actor", Map.of())).get("login"));
                            simplified.put("createdAt", run.get("created_at"));
                            simplified.put("updatedAt", run.get("updated_at"));
                            simplified.put("runUrl", run.get("html_url"));
                            allRuns.add(simplified);
                        }
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch workflow runs for repo {}: {}", repo, e.getMessage());
            }
        }

        return allRuns;
    }

    public List<Map<String, Object>> getAllDeployments() {
        return getAllDeployments(null, null);
    }

    public List<Map<String, Object>> getAllDeployments(String tokenOverride, String reposOverride) {
        String activeToken = (tokenOverride != null && !tokenOverride.isBlank()) ? tokenOverride : githubToken;
        String activeRepos = (reposOverride != null && !reposOverride.isBlank()) ? reposOverride : githubRepos;

        List<Map<String, Object>> allDeployments = new ArrayList<>();

        if (activeToken == null || activeToken.isBlank() || activeRepos == null || activeRepos.isBlank()) {
            return Collections.emptyList();
        }

        for (String repo : activeRepos.split(",")) {
            repo = repo.trim();
            if (repo.isEmpty()) continue;
            try {
                String url = GITHUB_API + "/repos/" + repo + "/deployments?per_page=5";
                ResponseEntity<List> response = restTemplate.exchange(
                        url, HttpMethod.GET, buildHeaders(activeToken), List.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> deploys = response.getBody();
                    for (Map<String, Object> d : deploys) {
                        Map<String, Object> simplified = new LinkedHashMap<>();
                        simplified.put("id", d.get("id"));
                        simplified.put("repo", repo);
                        simplified.put("environment", d.get("environment"));
                        simplified.put("ref", d.get("ref"));
                        simplified.put("sha", String.valueOf(d.get("sha")).substring(0, Math.min(7, String.valueOf(d.get("sha")).length())));
                        simplified.put("creator", ((Map<?, ?>) d.getOrDefault("creator", Map.of())).get("login"));
                        simplified.put("createdAt", d.get("created_at"));
                        allDeployments.add(simplified);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to fetch deployments for repo {}: {}", repo, e.getMessage());
            }
        }

        return allDeployments;
    }

    public Map<String, Object> getCiCdSummary() {
        return getCiCdSummary(null, null);
    }

    public Map<String, Object> getCiCdSummary(String tokenOverride, String reposOverride) {
        String activeToken = (tokenOverride != null && !tokenOverride.isBlank()) ? tokenOverride : githubToken;
        String activeRepos = (reposOverride != null && !reposOverride.isBlank()) ? reposOverride : githubRepos;

        boolean isConfigured = activeToken != null && !activeToken.isBlank() && activeRepos != null && !activeRepos.isBlank();
        List<Map<String, Object>> runs = getAllWorkflowRuns(tokenOverride, reposOverride);
        long total = runs.size();
        long success = runs.stream().filter(r -> "success".equals(r.get("conclusion"))).count();
        long failed = runs.stream().filter(r -> "failure".equals(r.get("conclusion"))).count();
        long inProgress = runs.stream().filter(r -> "in_progress".equals(r.get("status"))).count();

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalRuns", total);
        summary.put("successRuns", success);
        summary.put("failedRuns", failed);
        summary.put("inProgressRuns", inProgress);
        summary.put("successRate", total > 0 ? Math.round((double) success / total * 100) : 0);
        summary.put("connected", isConfigured);
        summary.put("configuredRepo", isConfigured ? activeRepos : null);
        summary.put("recentRuns", runs.stream().limit(5).toList());
        return summary;
    }

    private HttpEntity<Void> buildHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("Accept", "application/vnd.github.v3+json");
        headers.set("X-GitHub-Api-Version", "2022-11-28");
        if (token != null && !token.isBlank()) {
            headers.set("Authorization", "Bearer " + token);
        }
        return new HttpEntity<>(headers);
    }
}
