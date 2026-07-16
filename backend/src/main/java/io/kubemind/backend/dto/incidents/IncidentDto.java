package io.kubemind.backend.dto.incidents;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IncidentDto {
    private UUID id;
    private String incidentCode;
    private String clusterName;
    private String namespace;
    private String podName;
    private String containerName;
    private String reason; // CrashLoopBackOff, ImagePullBackOff, OOMKilled, FailedScheduling
    private String severity; // CRITICAL, WARNING, INFO
    private String status;   // OPEN, INVESTIGATING, RESOLVED
    private String logSnippet;
    private String aiSummary;
    private String detectedAt;
    private String resolvedAt;
}
