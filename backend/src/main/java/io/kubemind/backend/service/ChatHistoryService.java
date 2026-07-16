package io.kubemind.backend.service;

import io.kubemind.backend.dto.copilot.ChatMessageDto;
import io.kubemind.backend.dto.copilot.ChatSessionDto;
import io.kubemind.backend.dto.copilot.CreateSessionRequest;
import io.kubemind.backend.entity.ChatMessage;
import io.kubemind.backend.entity.ChatSession;
import io.kubemind.backend.repository.ChatMessageRepository;
import io.kubemind.backend.repository.ChatSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatHistoryService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;

    @Transactional(readOnly = true)
    public List<ChatSessionDto> getAllSessions() {
        try {
            List<ChatSession> sessions = chatSessionRepository.findAll();
            if (!sessions.isEmpty()) {
                return sessions.stream().map(this::mapToSessionDto).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Error fetching sessions from database: {}", ex.getMessage());
        }

        return Collections.emptyList();
    }

    @Transactional
    public ChatSessionDto createSession(CreateSessionRequest request) {
        ChatSession session = ChatSession.builder()
                .sessionTitle(request.getSessionTitle())
                .build();
        ChatSession saved = chatSessionRepository.save(session);
        log.info("Created new Copilot chat session: {}", saved.getId());
        return mapToSessionDto(saved);
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesBySession(UUID sessionId) {
        try {
            List<ChatMessage> messages = chatMessageRepository.findBySessionIdOrderByCreatedAtAsc(sessionId);
            if (!messages.isEmpty()) {
                return messages.stream().map(this::mapToMessageDto).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Error fetching chat messages from database: {}", ex.getMessage());
        }

        return Collections.emptyList();
    }

    private ChatSessionDto mapToSessionDto(ChatSession session) {
        return ChatSessionDto.builder()
                .id(session.getId())
                .sessionTitle(session.getSessionTitle())
                .createdAt(session.getCreatedAt() != null ? session.getCreatedAt().toString() : Instant.now().toString())
                .build();
    }

    private ChatMessageDto mapToMessageDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .sessionId(message.getSessionId())
                .sender(message.getSender())
                .content(message.getContent())
                .toolsExecuted(message.getToolsExecuted())
                .confidenceScore(message.getConfidenceScore())
                .remediationCommand(message.getRemediationCommand())
                .createdAt(message.getCreatedAt() != null ? message.getCreatedAt().toString() : Instant.now().toString())
                .build();
    }
}
