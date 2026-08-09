package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Pod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PodRepository extends JpaRepository<Pod, UUID> {
    Optional<Pod> findByNamespaceIdAndPodName(UUID namespaceId, String podName);
    Optional<Pod> findByPodUid(String podUid);
    List<Pod> findByNamespaceId(UUID namespaceId);
    List<Pod> findByNodeId(UUID nodeId);
}
