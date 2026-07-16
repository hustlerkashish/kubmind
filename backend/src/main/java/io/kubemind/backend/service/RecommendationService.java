package io.kubemind.backend.service;

import io.kubemind.backend.dto.recommendation.IncidentReportDto;
import io.kubemind.backend.dto.recommendation.RecommendationDto;
import io.kubemind.backend.entity.IncidentReport;
import io.kubemind.backend.entity.Recommendation;
import io.kubemind.backend.exception.ResourceNotFoundException;
import io.kubemind.backend.repository.IncidentReportRepository;
import io.kubemind.backend.repository.RecommendationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final IncidentReportRepository incidentReportRepository;

    @Transactional(readOnly = true)
    public List<RecommendationDto> getRecommendations(String type, String namespace) {
        try {
            List<Recommendation> list = recommendationRepository.findAll();
            if (!list.isEmpty()) {
                if (type != null && !type.isBlank() && !type.equalsIgnoreCase("all")) {
                    list = list.stream().filter(r -> r.getRecommendationType().equalsIgnoreCase(type)).collect(Collectors.toList());
                }
                if (namespace != null && !namespace.isBlank() && !namespace.equalsIgnoreCase("all")) {
                    list = list.stream().filter(r -> r.getNamespace().equalsIgnoreCase(namespace)).collect(Collectors.toList());
                }
                return list.stream().map(this::mapToDto).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Error fetching recommendations from database: {}", ex.getMessage());
        }

        return Collections.emptyList();
    }

    @Transactional
    public RecommendationDto applyRecommendation(UUID id) {
        Recommendation recommendation = recommendationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Recommendation", "id", id));

        recommendation.setApplied(true);
        Recommendation saved = recommendationRepository.save(recommendation);
        log.info("Recommendation {} marked as applied", id);
        return mapToDto(saved);
    }

    @Transactional(readOnly = true)
    public List<IncidentReportDto> getReports(String reportType) {
        try {
            List<IncidentReport> reports = incidentReportRepository.findAll();
            if (!reports.isEmpty()) {
                if (reportType != null && !reportType.isBlank() && !reportType.equalsIgnoreCase("all")) {
                    reports = reports.stream().filter(r -> r.getReportType().equalsIgnoreCase(reportType)).collect(Collectors.toList());
                }
                return reports.stream().map(this::mapToReportDto).collect(Collectors.toList());
            }
        } catch (Exception ex) {
            log.warn("Error fetching reports from database: {}", ex.getMessage());
        }

        return Collections.emptyList();
    }

    public byte[] exportReportCsv(UUID reportId) {
        String csvContent = "ReportID,Title,Type,TotalIncidents,CriticalCount,ResolvedCount,GeneratedAt\n" +
                reportId + ",\"Reliability Audit\",AUDIT,0,0,0," + Instant.now().toString() + "\n";
        return csvContent.getBytes(StandardCharsets.UTF_8);
    }

    public byte[] exportReportPdf(UUID reportId) {
        String pdfTextHeader = "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n" +
                "KubeMind Infrastructure Audit Summary Report\n" +
                "Report ID: " + reportId + "\n" +
                "Generated At: " + Instant.now().toString() + "\n";
        return pdfTextHeader.getBytes(StandardCharsets.UTF_8);
    }

    private RecommendationDto mapToDto(Recommendation rec) {
        return RecommendationDto.builder()
                .id(rec.getId())
                .incidentCode(rec.getIncidentCode())
                .clusterName(rec.getClusterName())
                .namespace(rec.getNamespace())
                .podName(rec.getPodName())
                .recommendationType(rec.getRecommendationType())
                .actionSummary(rec.getActionSummary())
                .suggestedCommand(rec.getSuggestedCommand())
                .cpuAdjustment(rec.getCpuAdjustment())
                .memoryAdjustment(rec.getMemoryAdjustment())
                .replicaAdjustment(rec.getReplicaAdjustment())
                .recurringCount(rec.getRecurringCount() != null ? rec.getRecurringCount() : 1)
                .applied(rec.getApplied() != null ? rec.getApplied() : false)
                .createdAt(rec.getCreatedAt() != null ? rec.getCreatedAt().toString() : Instant.now().toString())
                .build();
    }

    private IncidentReportDto mapToReportDto(IncidentReport report) {
        return IncidentReportDto.builder()
                .id(report.getId())
                .reportTitle(report.getReportTitle())
                .reportType(report.getReportType())
                .totalIncidents(report.getTotalIncidents())
                .criticalCount(report.getCriticalCount())
                .resolvedCount(report.getResolvedCount())
                .summaryJson(report.getSummaryJson())
                .generatedAt(report.getGeneratedAt() != null ? report.getGeneratedAt().toString() : Instant.now().toString())
                .build();
    }
}
