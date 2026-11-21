package io.kubemind.backend.dto.copilot;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CopilotChatResponse {
    private String status;
    private String reply;
    private List<String> toolsExecuted;
    private CopilotDiagnosisDto diagnosis;
}
