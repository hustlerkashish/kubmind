package io.kubemind.backend.repository;

import io.kubemind.backend.entity.K8sEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface K8sEventRepository extends JpaRepository<K8sEvent, UUID> {
    List<K8sEvent> findByPodIdOrderByCreatedAtDesc(UUID podId);
}
