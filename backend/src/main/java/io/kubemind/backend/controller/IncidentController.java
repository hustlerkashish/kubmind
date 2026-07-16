package io.kubemind.backend.controller;

import io.kubemind.backend.dto.ApiResponse;
import io.kubemind.backend.dto.incidents.IncidentDto;
import io.kubemind.backend.dto.incidents.UpdateIncidentStatusRequest;
import io.kubemind.backend.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/incidents")
@RequiredArgsConstructor
@Tag(name = "Incident Center API", description = "Query, track, inspect and resolve Kubernetes incidents (CrashLoopBackOff, ImagePullBackOff, OOMKilled, FailedScheduling)")
public class IncidentController {

    private final IncidentService incidentService;

    @GetMapping
    @Operation(summary = "Get incidents list (supports status & namespace filtering)")
    public ResponseEntity<ApiResponse<List<IncidentDto>>> getAllIncidents(
            @RequestParam(required = false, defaultValue = "all") String status,
            @RequestParam(required = false, defaultValue = "all") String namespace
    ) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getAllIncidents(status, namespace), "Incidents list retrieved"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get detailed incident timeline and container crash logs")
    public ResponseEntity<ApiResponse<IncidentDto>> getIncidentById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.getIncidentById(id), "Incident details retrieved"));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update incident state (OPEN, INVESTIGATING, RESOLVED)")
    public ResponseEntity<ApiResponse<IncidentDto>> updateIncidentStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIncidentStatusRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(incidentService.updateIncidentStatus(id, request), "Incident status updated"));
    }
}
