package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "pods", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"namespace_id", "pod_name"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pod {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "namespace_id", nullable = false)
    private Namespace namespace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "node_id")
    private Node node;

    @Column(nullable = false, length = 150)
    private String podName;

    @Column(length = 150)
    private String deploymentName;

    @Column(length = 150)
    private String replicaSet;

    @Column(length = 150)
    private String daemonSet;

    @Column(nullable = false, length = 255)
    private String imageName;

    @Column(unique = true, length = 100)
    private String podUid;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "RUNNING";

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
