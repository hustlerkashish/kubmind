package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.copilot.ChatMessageDto;
import io.kubemind.backend.dto.copilot.ChatSessionDto;
import io.kubemind.backend.dto.copilot.CreateSessionRequest;
import io.kubemind.backend.service.ChatHistoryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/copilot")
@RequiredArgsConstructor
@Tag(name = "Copilot Chat History API", description = "Query and persist ChatGPT-style multi-session conversation history")
public class ChatHistoryController {

    private final ChatHistoryService chatHistoryService;

    @GetMapping("/sessions")
    @Operation(summary = "Get all historical Copilot chat sessions")
    public ResponseEntity<ApiResponse<List<ChatSessionDto>>> getAllSessions() {
        return ResponseEntity.ok(ApiResponse.success(chatHistoryService.getAllSessions(), "Chat sessions retrieved"));
    }

    @PostMapping("/sessions")
    @Operation(summary = "Create a new Copilot chat session")
    public ResponseEntity<ApiResponse<ChatSessionDto>> createSession(@Valid @RequestBody CreateSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(chatHistoryService.createSession(request), "Chat session created"));
    }

    @GetMapping("/sessions/{sessionId}/messages")
    @Operation(summary = "Get all messages for a specific session")
    public ResponseEntity<ApiResponse<List<ChatMessageDto>>> getMessagesBySession(@PathVariable UUID sessionId) {
        return ResponseEntity.ok(ApiResponse.success(chatHistoryService.getMessagesBySession(sessionId), "Chat messages retrieved"));
    }
}
