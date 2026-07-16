package io.kubemind.backend.repository;

import io.kubemind.backend.entity.IncidentReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentReportRepository extends JpaRepository<IncidentReport, UUID> {
    List<IncidentReport> findByReportType(String reportType);
}
