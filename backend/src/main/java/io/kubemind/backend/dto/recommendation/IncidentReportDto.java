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
public class IncidentReportDto {
    private UUID id;
    private String reportTitle;
    private String reportType; // DAILY, WEEKLY, MONTHLY
    private int totalIncidents;
    private int criticalCount;
    private int resolvedCount;
    private String summaryJson;
    private String generatedAt;
}
