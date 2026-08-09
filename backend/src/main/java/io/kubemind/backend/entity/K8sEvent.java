package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "k8s_events")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class K8sEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pod_id", nullable = false)
    private Pod pod;

    @Column(nullable = false, length = 50)
    private String eventType; // Normal, Warning

    @Column(nullable = false, length = 100)
    private String reason;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
