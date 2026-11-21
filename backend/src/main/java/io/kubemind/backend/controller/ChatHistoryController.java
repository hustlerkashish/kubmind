package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.copilot.ChatMessageDto;
import io.kubemind.backend.dto.copilot.ChatSessionDto;
import io.kubemind.backend.dto.copilot.CreateSessionRequest;
import io.kubemind.backend.security.UserPrincipal;
import io.kubemind.backend.service.ChatHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/copilot")
@RequiredArgsConstructor
@Tag(name = "Copilot Chat History API",
     description = "Authenticated, user-owned Copilot conversations")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    @GetMapping("/sessions")
    @Operation(summary = "Get the authenticated user's chat sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionDto>>> getAllSessions(
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(ApiResponse.success(
                chatHistoryService.getAllSessions(principal.getId()),
                "Chat sessions retrieved"));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Create a chat session for the authenticated user")
    public ResponseEntity<ApiResponse<ChatSessionDto>> createSession(
            @Valid @RequestBody CreateSessionRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(ApiResponse.success(
                chatHistoryService.createSession(request, principal.getId()),
                "Chat session created"));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Get messages from an owned chat session")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessagesBySession(
            @PathVariable UUID sessionId,
            @AuthenticationPrincipal UserPrincipal principal) {

        return ResponseEntity.ok(ApiResponse.success(
                chatHistoryService.getMessagesBySession(sessionId, principal.getId()),
                "Chat messages retrieved"));
    }
}
