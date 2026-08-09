package io.kubemind.backend.repository;

import io.kubemind.backend.entity.PodMetric;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface PodMetricRepository extends JpaRepository<PodMetric, UUID> {
    List<PodMetric> findByPodIdOrderByCollectedAtDesc(UUID podId);
}
