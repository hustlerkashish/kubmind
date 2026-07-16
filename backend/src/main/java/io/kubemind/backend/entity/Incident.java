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

    @Column(nullable = false, length = 100)
    private String clusterName;

    @Column(nullable = false, length = 100)
    private String namespace;

    @Column(nullable = false, length = 150)
    private String podName;

    @Column(length = 100)
    private String containerName;

    @Column(nullable = false, length = 100)
    private String reason; // CrashLoopBackOff, ImagePullBackOff, OOMKilled, FailedScheduling

    @Column(nullable = false, length = 50)
    private String severity; // CRITICAL, WARNING, INFO

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "OPEN"; // OPEN, INVESTIGATING, RESOLVED

    @Column(columnDefinition = "TEXT")
    private String logSnippet;

    @Column(columnDefinition = "TEXT")
    private String aiSummary;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant detectedAt;

    private Instant resolvedAt;

    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;
}
