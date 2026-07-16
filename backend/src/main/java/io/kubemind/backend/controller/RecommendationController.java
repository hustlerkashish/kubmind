package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.recommendation.IncidentReportDto;
import io.kubemind.backend.dto.recommendation.RecommendationDto;
import io.kubemind.backend.service.RecommendationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping
@RequiredArgsConstructor
@Tag(name = "Recommendation Engine & Reports API", description = "Query, apply recommendations (CPU/Memory scaling, commands) & export Daily/Weekly/Monthly PDF & CSV reports")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/recommendations")
    @Operation(summary = "Get active cluster optimization recommendations")
    public ResponseEntity<ApiResponse<List<RecommendationDto>>> getRecommendations(
            @RequestParam(required = false, defaultValue = "all") String type,
            @RequestParam(required = false, defaultValue = "all") String namespace
    ) {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getRecommendations(type, namespace), "Recommendations retrieved"));
    }

    @PutMapping("/recommendations/{id}/apply")
    @Operation(summary = "Mark a recommendation as applied in database")
    public ResponseEntity<ApiResponse<RecommendationDto>> applyRecommendation(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.applyRecommendation(id), "Recommendation applied successfully"));
    }

    @GetMapping("/reports")
    @Operation(summary = "List Daily, Weekly, and Monthly incident summary reports")
    public ResponseEntity<ApiResponse<List<IncidentReportDto>>> getReports(@RequestParam(required = false, defaultValue = "all") String reportType) {
        return ResponseEntity.ok(ApiResponse.success(recommendationService.getReports(reportType), "Reports list retrieved"));
    }

    @GetMapping("/reports/{id}/export/csv")
    @Operation(summary = "Export telemetry report data in CSV spreadsheet format")
    public ResponseEntity<byte[]> exportReportCsv(@PathVariable UUID id) {
        byte[] csvBytes = recommendationService.exportReportCsv(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"kubemind-report-" + id + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv"))
                .body(csvBytes);
    }

    @GetMapping("/reports/{id}/export/pdf")
    @Operation(summary = "Export telemetry summary report in PDF document format")
    public ResponseEntity<byte[]> exportReportPdf(@PathVariable UUID id) {
        byte[] pdfBytes = recommendationService.exportReportPdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"kubemind-report-" + id + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }
}
