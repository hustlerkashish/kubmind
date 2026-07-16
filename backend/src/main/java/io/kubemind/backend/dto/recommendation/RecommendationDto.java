package io.kubemind.backend.dto.recommendation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class RecommendationDto {
    private UUID id;
    private String incidentCode;
    private String clusterName;
    private String namespace;
    private String podName;
    private String recommendationType; // RESOURCE_ADJUSTMENT, REPLICA_SCALING, COMMAND, RECURRING_INCIDENT
    private String actionSummary;
    private String suggestedCommand;
    private String cpuAdjustment;
    private String memoryAdjustment;
    private String replicaAdjustment;
    private int recurringCount;
    private boolean applied;
    private String createdAt;
}
