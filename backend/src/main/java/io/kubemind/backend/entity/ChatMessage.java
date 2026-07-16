package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "chat_messages")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID sessionId;

    @Column(nullable = false, length = 20)
    private String sender; // user, assistant

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    private String toolsExecuted;

    private Integer confidenceScore;

    @Column(columnDefinition = "TEXT")
    private String remediationCommand;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
