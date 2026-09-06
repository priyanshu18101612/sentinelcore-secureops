package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.service.IncidentWorkflowService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Member 3 endpoints — sit alongside Priyanshu's IncidentController
 * (which handles plain GET/POST/PUT/DELETE on /api/incidents).
 * These are separate sub-paths, so there is no route clash.
 */
@RestController
@RequestMapping("/api/incidents")
public class IncidentWorkflowController {

    private final IncidentWorkflowService workflowService;

    public IncidentWorkflowController(IncidentWorkflowService workflowService) {
        this.workflowService = workflowService;
    }

    @PatchMapping("/{id}/severity")
    public ResponseEntity<?> updateSeverity(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            Severity severity = Severity.valueOf(body.get("severity").toUpperCase());
            return ResponseEntity.ok(workflowService.updateSeverity(id, severity));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<?> assign(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(workflowService.assignTeam(id, body.get("team")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> transitionStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            IncidentStatus status = IncidentStatus.valueOf(body.get("status").toUpperCase());
            return ResponseEntity.ok(workflowService.transitionStatus(id, status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{id}/resolve")
    public ResponseEntity<?> resolve(@PathVariable Long id, @RequestBody Map<String, String> body) {
        try {
            return ResponseEntity.ok(workflowService.resolveIncident(id, body.get("resolutionNotes")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
