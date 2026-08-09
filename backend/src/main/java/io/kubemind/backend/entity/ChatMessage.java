package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
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

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSession session;

    @Column(nullable = false, length = 20)
    private String sender; // user, assistant

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 255)
    private String toolsExecuted;

    private Integer confidenceScore;

    @Column(columnDefinition = "TEXT")
    private String remediationCommand;

    @Column(length = 100)
    @Builder.Default
    private String modelName = "gemini-3.6-flash";

    @Builder.Default
    private Integer tokenUsage = 0;

    @Builder.Default
    private Integer latencyMs = 0;

    @Column(columnDefinition = "TEXT")
    private String toolResponse;

    @Column(length = 20)
    private String feedback;

    @Column(precision = 10, scale = 6)
    @Builder.Default
    private BigDecimal executionCost = BigDecimal.ZERO;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
