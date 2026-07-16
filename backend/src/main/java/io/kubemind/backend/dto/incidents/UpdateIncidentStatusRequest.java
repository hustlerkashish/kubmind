package io.kubemind.backend.dto.incidents;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UpdateIncidentStatusRequest {
    @NotBlank(message = "Status is required (OPEN, INVESTIGATING, RESOLVED)")
    private String status;
}
