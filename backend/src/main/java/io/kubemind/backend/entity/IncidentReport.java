package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "incident_reports")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, length = 200)
    private String reportTitle;

    @Column(nullable = false, length = 50)
    private String reportType; // DAILY, WEEKLY, MONTHLY

    @Builder.Default
    private Integer totalIncidents = 0;

    @Builder.Default
    private Integer criticalCount = 0;

    @Builder.Default
    private Integer resolvedCount = 0;

    @Column(columnDefinition = "TEXT")
    private String summaryJson;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant generatedAt;
}
