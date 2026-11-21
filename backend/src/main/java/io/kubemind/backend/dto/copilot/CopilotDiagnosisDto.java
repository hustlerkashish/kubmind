package io.kubemind.backend.dto.copilot;

import lombok.Data;

@Data
public class CopilotDiagnosisDto {
    private String reason;
    private Integer confidenceScore;
    private String summary;
    private String remediationCommand;
}
