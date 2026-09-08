package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.service.AuditLogService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentAuditController {

    private final AuditLogService auditLogService;

    public IncidentAuditController(AuditLogService auditLogService) {
        this.auditLogService = auditLogService;
    }

    @GetMapping("/{id}/audit")
    public List<AuditLog> getAuditLogs(@PathVariable Long id) {
        return auditLogService.getAuditLogs(id);
    }
}