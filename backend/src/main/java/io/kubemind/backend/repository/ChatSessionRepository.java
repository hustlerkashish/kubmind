package io.kubemind.backend.repository;

import io.kubemind.backend.entity.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, UUID> {

    List<ChatSession> findAllByUserIdOrderByUpdatedAtDesc(UUID userId);

    Optional<ChatSession> findByIdAndUserId(UUID sessionId, UUID userId);
}
