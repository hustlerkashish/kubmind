package io.kubemind.backend.dto;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String fullName;

    @Size(min = 6, max = 100, message = "Password must be at least 6 characters long")
    private String newPassword;
}
