package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "clusters")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Cluster {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false, unique = true, length = 100)
    private String clusterName;

    @Column(nullable = false, length = 50)
    private String provider; // AWS-EKS, Azure-AKS, Google-GKE, Minikube

    @Column(length = 50)
    private String region;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String environment = "production";

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "ACTIVE";

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
