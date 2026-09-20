package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AccessLog;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccessTrackingService {

    private final AccessLogRepository accessLogRepository;
    private final AuditLogService auditLogService;

    public record AccessTrackingSummary(
            long totalEvents,
            long successfulLogins,
            long failedLogins,
            long logouts,
            long privilegeElevations,
            List<AccessLog> recentActivity
    ) {}

    public AccessTrackingService(AccessLogRepository accessLogRepository, AuditLogService auditLogService) {
        this.accessLogRepository = accessLogRepository;
        this.auditLogService = auditLogService;
    }

    public AccessTrackingSummary getAccessTrackingSummary() {
        long total = accessLogRepository.count();
        long success = accessLogRepository.countByEventType("LOGIN_SUCCESS");
        long failed = accessLogRepository.countByEventType("LOGIN_FAILURE");
        long logouts = accessLogRepository.countByEventType("LOGOUT");
        long privilege = accessLogRepository.countByEventType("PRIVILEGE_ELEVATION");
        List<AccessLog> recent = accessLogRepository.findAllByOrderByTimestampDesc();

        return new AccessTrackingSummary(
                total,
                success,
                failed,
                logouts,
                privilege,
                recent
        );
    }

    public AccessLog logEvent(
            String username,
            String ipAddress,
            String eventType,
            String status,
            String failureReason,
            String userAgent
    ) {
        AccessLog log = new AccessLog(
                username != null ? username : "anonymous",
                ipAddress != null ? ipAddress : "127.0.0.1",
                eventType != null ? eventType : "LOGIN_SUCCESS",
                status != null ? status : "SUCCESS",
                failureReason,
                userAgent != null ? userAgent : "SentinelCore-WebClient",
                LocalDateTime.now()
        );

        AccessLog saved = accessLogRepository.save(log);

        // Mirror important access security events to the immutable audit log
        auditLogService.logAction(
                null,
                "AUTH",
                saved.getUsername(),
                "ACCESS_CONTROL",
                saved.getEventType(),
                saved.getUsername(),
                "AccessTrackingService",
                "Authentication event " + saved.getEventType() + " (" + saved.getStatus() + ")"
                        + (saved.getFailureReason() != null ? " Reason: " + saved.getFailureReason() : "")
                        + " from IP " + saved.getIpAddress()
        );

        return saved;
    }
}
