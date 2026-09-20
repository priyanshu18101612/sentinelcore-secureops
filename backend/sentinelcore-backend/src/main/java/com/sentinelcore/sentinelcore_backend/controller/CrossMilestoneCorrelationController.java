package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.CrossMilestoneCorrelationService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/devsecops")
public class CrossMilestoneCorrelationController {

    private final CrossMilestoneCorrelationService correlationService;

    public CrossMilestoneCorrelationController(CrossMilestoneCorrelationService correlationService) {
        this.correlationService = correlationService;
    }

    @GetMapping("/host-correlation")
    public ResponseEntity<CrossMilestoneCorrelationService.HostCorrelationResponse> getHostCorrelation() {
        return ResponseEntity.ok(correlationService.getHostCorrelation());
    }

    @PostMapping(value = "/full-system-audit", consumes = {MediaType.APPLICATION_JSON_VALUE, MediaType.ALL_VALUE})
    public ResponseEntity<Map<String, Object>> runFullSystemAudit(@RequestBody(required = false) Map<String, String> request) {
        String customPath = request != null ? request.get("path") : null;
        Map<String, Object> result = correlationService.runFullSystemAudit(customPath);
        if ("ALREADY_RUNNING".equals(result.get("status"))) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(result);
        }
        return ResponseEntity.ok(result);
    }
}
