package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Node;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface NodeRepository extends JpaRepository<Node, UUID> {
    Optional<Node> findByClusterIdAndNodeName(UUID clusterId, String nodeName);
    List<Node> findByClusterId(UUID clusterId);
}
