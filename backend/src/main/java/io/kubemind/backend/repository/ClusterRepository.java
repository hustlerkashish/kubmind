package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Cluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ClusterRepository extends JpaRepository<Cluster, UUID> {
    Optional<Cluster> findByClusterName(String clusterName);
}
