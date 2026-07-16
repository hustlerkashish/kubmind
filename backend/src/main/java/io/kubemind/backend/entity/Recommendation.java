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

    private String incidentCode;

    @Column(nullable = false, length = 100)
    private String clusterName;

    @Column(nullable = false, length = 100)
    private String namespace;

    @Column(nullable = false, length = 150)
    private String podName;

    @Column(nullable = false, length = 50)
    private String recommendationType; // RESOURCE_ADJUSTMENT, REPLICA_SCALING, COMMAND, RECURRING_INCIDENT

    @Column(columnDefinition = "TEXT", nullable = false)
    private String actionSummary;

    @Column(columnDefinition = "TEXT")
    private String suggestedCommand;

    private String cpuAdjustment;

    private String memoryAdjustment;

    private String replicaAdjustment;

    @Builder.Default
    private Integer recurringCount = 1;

    @Builder.Default
    private Boolean applied = false;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
