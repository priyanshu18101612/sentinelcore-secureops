package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getAuditLogs(Long incidentId) {
        return auditLogRepository.findByIncidentIdOrderByTimestampDesc(incidentId);
    }

    public AuditLog logAction(
            Long incidentId,
            String action,
            String actor,
            String source,
            String details
    ) {
        AuditLog auditLog = new AuditLog(
                incidentId,
                action,
                actor,
                source,
                LocalDateTime.now(),
                details
        );

        return auditLogRepository.save(auditLog);
    }
}