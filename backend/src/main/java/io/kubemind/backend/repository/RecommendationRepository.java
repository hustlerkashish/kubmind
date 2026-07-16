package io.kubemind.backend.repository;

import io.kubemind.backend.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RecommendationRepository extends JpaRepository<Recommendation, UUID> {
    List<Recommendation> findByApplied(Boolean applied);
    List<Recommendation> findByRecommendationType(String recommendationType);
}
