package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.service.AuditLogService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/audit")
public class AuditLogController {

    private final AuditLogService auditLogService;

    public AuditLogController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String search
    ) {
        List<AuditLog> logs = auditLogService.getAllAuditLogs(category, entityType, search);
        return ResponseEntity.ok(logs);
    }

    @PostMapping("/verify-chain")
    public ResponseEntity<AuditLogService.ChainVerificationResult> verifyChain() {
        AuditLogService.ChainVerificationResult result = auditLogService.verifyChainIntegrity();
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<AuditLogService.AuditStats> getStats() {
        AuditLogService.AuditStats stats = auditLogService.getAuditStats();
        return ResponseEntity.ok(stats);
    }
}
