package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {
    Optional<Incident> findByIncidentCode(String incidentCode);
    List<Incident> findByStatus(String status);
    List<Incident> findBySeverity(String severity);
    List<Incident> findByClusterId(UUID clusterId);
    List<Incident> findByNamespaceId(UUID namespaceId);
    List<Incident> findByPodId(UUID podId);
    List<Incident> findByAssignedToId(UUID userId);
    List<Incident> findByStatusAndSeverity(String status, String severity);
    List<Incident> findByClusterIdAndStatus(UUID clusterId, String status);
}
