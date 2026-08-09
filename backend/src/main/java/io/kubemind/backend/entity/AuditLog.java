package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "audit_logs")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false, length = 100)
    private String entityName;

    @Column(nullable = false, length = 100)
    private String entityId;

    @Column(nullable = false, length = 50)
    private String action;

    @Column(columnDefinition = "jsonb")
    private String oldValue;

    @Column(columnDefinition = "jsonb")
    private String newValue;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
