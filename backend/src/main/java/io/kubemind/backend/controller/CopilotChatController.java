package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.copilot.CopilotChatRequest;
import io.kubemind.backend.dto.copilot.CopilotChatResponse;
import io.kubemind.backend.security.UserPrincipal;
import io.kubemind.backend.service.CopilotChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/copilot/sessions")
@RequiredArgsConstructor
public class CopilotChatController {

    private final CopilotChatService copilotChatService;

    @PostMapping("/{sessionId}/chat")
    public ResponseEntity<ApiResponse<CopilotChatResponse>> chat(
            @PathVariable UUID sessionId,
            @Valid @RequestBody CopilotChatRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        CopilotChatResponse response = copilotChatService.chat(
                sessionId, principal.getId(), request);

        return ResponseEntity.ok(
                ApiResponse.success(response, "Copilot response generated"));
    }
}
