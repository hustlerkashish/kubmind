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
public class ChatMessageDto {
    private UUID id;
    private UUID sessionId;
    private String sender;
    private String content;
    private String toolsExecuted;
    private Integer confidenceScore;
    private String remediationCommand;
    private String createdAt;
}
