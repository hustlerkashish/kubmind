package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incidents")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 50)
    private String incidentCode;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cluster_id", nullable = false)
    private Cluster cluster;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "namespace_id", nullable = false)
    private Namespace namespace;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pod_id", nullable = false)
    private Pod pod;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_type_id", nullable = false)
    private IncidentType incidentType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to")
    private User assignedTo;

    @Column(nullable = false, length = 20)
    private String severity; // INFO, LOW, MEDIUM, HIGH, CRITICAL

    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "OPEN"; // OPEN, INVESTIGATING, IN_PROGRESS, RESOLVED, CLOSED

    @Column(columnDefinition = "TEXT")
    private String logSnippet;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant detectedAt;

    private Instant resolvedAt;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;
}
