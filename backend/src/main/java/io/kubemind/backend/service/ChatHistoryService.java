package io.kubemind.backend.service;

import io.kubemind.backend.dto.copilot.ChatMessageDto;
import io.kubemind.backend.dto.copilot.ChatSessionDto;
import io.kubemind.backend.dto.copilot.CreateSessionRequest;
import io.kubemind.backend.entity.ChatMessage;
import io.kubemind.backend.entity.ChatSession;
import io.kubemind.backend.entity.User;
import io.kubemind.backend.repository.ChatMessageRepository;
import io.kubemind.backend.repository.ChatSessionRepository;
import io.kubemind.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatHistoryService {

    private final ChatSessionRepository chatSessionRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<ChatSessionDto> getAllSessions(UUID userId) {
        return chatSessionRepository
                .findAllByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::mapToSessionDto)
                .toList();
    }

    @Transactional
    public ChatSessionDto createSession(CreateSessionRequest request, UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Authenticated user no longer exists"));

        ChatSession session = ChatSession.builder()
                .user(user)
                .sessionTitle(request.getSessionTitle().trim())
                .build();

        return mapToSessionDto(chatSessionRepository.save(session));
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDto> getMessagesBySession(UUID sessionId, UUID userId) {
        ChatSession session = getOwnedSession(sessionId, userId);

        return chatMessageRepository
                .findBySessionIdOrderByCreatedAtAsc(session.getId())
                .stream()
                .map(this::mapToMessageDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public ChatSession getOwnedSession(UUID sessionId, UUID userId) {
        return chatSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Chat session not found"));
    }

    private ChatSessionDto mapToSessionDto(ChatSession session) {
        return ChatSessionDto.builder()
                .id(session.getId())
                .sessionTitle(session.getSessionTitle())
                .createdAt(session.getCreatedAt() != null
                        ? session.getCreatedAt().toString()
                        : Instant.now().toString())
                .build();
    }

    private ChatMessageDto mapToMessageDto(ChatMessage message) {
        return ChatMessageDto.builder()
                .id(message.getId())
                .sessionId(message.getSession().getId())
                .sender(message.getSender())
                .content(message.getContent())
                .toolsExecuted(message.getToolsExecuted())
                .confidenceScore(message.getConfidenceScore())
                .remediationCommand(message.getRemediationCommand())
                .createdAt(message.getCreatedAt() != null
                        ? message.getCreatedAt().toString()
                        : Instant.now().toString())
                .build();
    }
}
