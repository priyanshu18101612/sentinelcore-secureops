package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.SecurityReport;
import com.sentinelcore.sentinelcore_backend.service.ReportGenerationService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
public class ReportGenerationController {

    private final ReportGenerationService reportGenerationService;

    public ReportGenerationController(ReportGenerationService reportGenerationService) {
        this.reportGenerationService = reportGenerationService;
    }

    @GetMapping
    public ResponseEntity<List<SecurityReport>> getAllReports() {
        return ResponseEntity.ok(reportGenerationService.getAllReports());
    }

    @GetMapping("/{id}")
    public ResponseEntity<SecurityReport> getReportById(@PathVariable Long id) {
        return reportGenerationService.getReportById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/generate")
    public ResponseEntity<SecurityReport> generateReport(@RequestBody(required = false) Map<String, String> body) {
        String type = body != null ? body.get("type") : "SECURITY_REPORT";
        String generatedBy = body != null ? body.get("generatedBy") : "Lead SecOps Engineer";

        SecurityReport report = reportGenerationService.generateReport(type, generatedBy);
        return ResponseEntity.ok(report);
    }

    @PostMapping("/{id}/verify-attestation")
    public ResponseEntity<ReportGenerationService.AttestationVerificationResult> verifyAttestation(@PathVariable Long id) {
        return ResponseEntity.ok(reportGenerationService.verifyAttestation(id));
    }

    @GetMapping(value = "/{id}/attestation-bundle", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<String> getAttestationBundle(@PathVariable Long id) {
        return reportGenerationService.getReportById(id)
                .map(report -> ResponseEntity.ok()
                        .header("Content-Disposition", "attachment; filename=\"sentinelcore-attestation-" + id + ".json\"")
                        .body(report.getSummaryData()))
                .orElse(ResponseEntity.notFound().build());
    }
}
