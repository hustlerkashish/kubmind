package io.kubemind.backend.repository;

import io.kubemind.backend.entity.IncidentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface IncidentTypeRepository extends JpaRepository<IncidentType, UUID> {
    Optional<IncidentType> findByName(String name);
}
