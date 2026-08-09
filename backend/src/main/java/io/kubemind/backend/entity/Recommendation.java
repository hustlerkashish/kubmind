package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "recommendations")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Column(nullable = false, length = 50)
    private String recommendationType; // RESOURCE_ADJUSTMENT, REPLICA_SCALING, COMMAND, RECURRING_INCIDENT

    @Column(nullable = false, columnDefinition = "TEXT")
    private String actionSummary;

    @Column(columnDefinition = "TEXT")
    private String suggestedCommand;

    @Column(length = 50)
    private String cpuAdjustment;

    @Column(length = 50)
    private String memoryAdjustment;

    @Column(length = 50)
    private String replicaAdjustment;

    @Builder.Default
    private Integer recurringCount = 1;

    @Builder.Default
    private Integer confidenceScore = 90;

    @Column(length = 50)
    @Builder.Default
    private String estimatedFixTime = "5 minutes";

    @Column(length = 20)
    @Builder.Default
    private String riskLevel = "LOW"; // LOW, MEDIUM, HIGH

    @Column(length = 20)
    @Builder.Default
    private String status = "PENDING"; // PENDING, APPROVED, REJECTED, APPLIED

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    private Instant approvedAt;

    private Instant appliedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
