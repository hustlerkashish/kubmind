package io.kubemind.backend.dto.copilot;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class CreateSessionRequest {
    @NotBlank(message = "Session title is required")
    private String sessionTitle;
}
