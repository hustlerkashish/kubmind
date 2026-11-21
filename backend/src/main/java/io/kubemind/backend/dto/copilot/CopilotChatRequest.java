package io.kubemind.backend.dto.copilot;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CopilotChatRequest {

    @NotBlank
    @Size(max = 10000)
    private String message;

    @Size(max = 253)
    private String namespace;

    @Size(max = 253)
    private String podName;
}
