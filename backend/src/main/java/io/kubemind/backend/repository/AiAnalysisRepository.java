package io.kubemind.backend.repository;

import io.kubemind.backend.entity.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, UUID> {
    List<AiAnalysis> findByIncidentIdOrderByCreatedAtDesc(UUID incidentId);
}
