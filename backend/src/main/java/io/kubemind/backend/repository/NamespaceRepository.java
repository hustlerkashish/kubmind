package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Namespace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NamespaceRepository extends JpaRepository<Namespace, UUID> {
    Optional<Namespace> findByClusterIdAndNamespaceName(UUID clusterId, String namespaceName);
    List<Namespace> findByClusterId(UUID clusterId);
}
