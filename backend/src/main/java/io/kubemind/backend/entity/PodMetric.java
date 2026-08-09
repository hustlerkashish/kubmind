package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pod_metrics")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PodMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pod_id", nullable = false)
    private Pod pod;

    @Column(nullable = false, length = 50)
    private String cpuUsage;

    @Column(nullable = false, length = 50)
    private String memoryUsage;

    @Column(length = 50)
    private String networkUsage;

    @Column(length = 50)
    private String diskUsage;

    @Builder.Default
    private Integer restartCount = 0;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant collectedAt;
}
