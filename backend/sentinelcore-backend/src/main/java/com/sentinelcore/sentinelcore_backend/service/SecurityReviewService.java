package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.SecurityReview;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.SecurityReviewRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class SecurityReviewService {

    private final SecurityReviewRepository securityReviewRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final IncidentRepository incidentRepository;
    private final AccessLogRepository accessLogRepository;
    private final AuditLogService auditLogService;

    public SecurityReviewService(
            SecurityReviewRepository securityReviewRepository,
            VulnerabilityRepository vulnerabilityRepository,
            IncidentRepository incidentRepository,
            AccessLogRepository accessLogRepository,
            AuditLogService auditLogService
    ) {
        this.securityReviewRepository = securityReviewRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.incidentRepository = incidentRepository;
        this.accessLogRepository = accessLogRepository;
        this.auditLogService = auditLogService;
    }

    public SecurityReview getCurrentReview() {
        return securityReviewRepository.findFirstByOrderByStartDateDesc()
                .orElseGet(this::createNewReviewCycle);
    }

    public synchronized SecurityReview createNewReviewCycle() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startDate = now.minusDays(30);

        // Count real anomalies across the platform
        int anomalies = countSystemAnomalies();

        String initialStatus = anomalies > 0 ? "FLAGGED" : "PENDING";
        String defaultNotes = anomalies > 0
                ? "Review cycle initialized with " + anomalies + " security item(s) flagged for remediation."
                : "Baseline security review initialized. System parameters nominal.";

        SecurityReview review = new SecurityReview(
                "Last 30 Days (" + now.getMonth().name() + " " + now.getYear() + ")",
                startDate,
                now,
                initialStatus,
                anomalies,
                null,
                null,
                defaultNotes,
                null
        );

        return securityReviewRepository.save(review);
    }

    public synchronized SecurityReview signOffReview(String reviewerName, String reviewerRole, String notes) {
        SecurityReview current = getCurrentReview();

        current.setReviewerName(reviewerName != null && !reviewerName.isBlank() ? reviewerName : "Lead SecOps Engineer");
        current.setReviewerRole(reviewerRole != null && !reviewerRole.isBlank() ? reviewerRole : "Security Administrator");
        current.setNotes(notes != null && !notes.isBlank() ? notes : "Periodic 30-day security review approved and signed off.");
        current.setSignedAt(LocalDateTime.now());
        current.setStatus("APPROVED");

        SecurityReview saved = securityReviewRepository.save(current);

        auditLogService.logAction(
                null,
                "SECURITY_REVIEW",
                String.valueOf(saved.getId()),
                "SECURITY_GOVERNANCE",
                "SECURITY_REVIEW_APPROVED",
                saved.getReviewerName(),
                "SecurityReviewService",
                "Security review #" + saved.getId() + " signed off by " + saved.getReviewerName()
                        + " (" + saved.getReviewerRole() + "). Anomalies detected: " + saved.getAnomaliesDetected()
        );

        return saved;
    }

    private int countSystemAnomalies() {
        int count = 0;

        // Anomaly 1: Unpatched CRITICAL vulnerabilities
        List<Vulnerability> vulns = vulnerabilityRepository.findAll();
        long unpatchedCritical = vulns.stream()
                .filter(v -> v.getSeverity() == VulnerabilitySeverity.CRITICAL && v.getPendingAssets() != null && v.getPendingAssets() > 0)
                .count();
        count += (int) unpatchedCritical;

        // Anomaly 2: Elevated failed login attempts (e.g. > 10 failed logins)
        long failedLogins = accessLogRepository.countByStatus("FAILED");
        if (failedLogins > 10) {
            count++;
        }

        // Anomaly 3: Audit log tampering
        if (auditLogService.verifyChainIntegrity().tamperDetected()) {
            count += 5;
        }

        return count;
    }
}
