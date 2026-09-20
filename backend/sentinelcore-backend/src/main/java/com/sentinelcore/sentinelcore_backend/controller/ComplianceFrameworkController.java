package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.ComplianceFrameworkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/compliance")
public class ComplianceFrameworkController {

    private final ComplianceFrameworkService complianceFrameworkService;

    public ComplianceFrameworkController(ComplianceFrameworkService complianceFrameworkService) {
        this.complianceFrameworkService = complianceFrameworkService;
    }

    @GetMapping("/frameworks")
    public ResponseEntity<ComplianceFrameworkService.OverallComplianceSummary> getFrameworks() {
        return ResponseEntity.ok(complianceFrameworkService.getFrameworksSummary());
    }

    @GetMapping("/frameworks/{framework}")
    public ResponseEntity<ComplianceFrameworkService.FrameworkSummary> getFrameworkDetail(@PathVariable String framework) {
        ComplianceFrameworkService.FrameworkSummary detail = complianceFrameworkService.getFrameworkDetail(framework);
        if (detail == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(detail);
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ComplianceFrameworkService.OverallComplianceSummary> evaluateCompliance() {
        return ResponseEntity.ok(complianceFrameworkService.evaluateAllFrameworks());
    }
}
