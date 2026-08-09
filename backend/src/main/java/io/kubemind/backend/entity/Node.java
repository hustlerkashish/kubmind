package io.kubemind.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "nodes", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"cluster_id", "node_name"})
})
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Node {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cluster_id", nullable = false)
    private Cluster cluster;

    @Column(nullable = false, length = 150)
    private String nodeName;

    @Column(nullable = false, length = 50)
    private String cpuCapacity;

    @Column(nullable = false, length = 50)
    private String memoryCapacity;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "READY";

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
