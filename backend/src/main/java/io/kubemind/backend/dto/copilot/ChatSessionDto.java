package io.kubemind.backend.dto.copilot;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ChatSessionDto {
    private UUID id;
    private String sessionTitle;
    private String createdAt;
}
