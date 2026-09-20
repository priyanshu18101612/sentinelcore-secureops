package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    public record ChainVerificationResult(
            String status,
            long totalRecords,
            boolean tamperDetected,
            String message,
            LocalDateTime verifiedAt
    ) {}

    public record AuditStats(
            long totalLogs,
            int retentionYears,
            boolean encrypted,
            String integrityStatus,
            boolean tamperDetected,
            LocalDateTime lastVerifiedAt
    ) {}

    public AuditLogService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public List<AuditLog> getAuditLogs(Long incidentId) {
        return auditLogRepository.findByIncidentIdOrderByTimestampDesc(incidentId);
    }

    public List<AuditLog> getAllAuditLogs(String category, String entityType, String search) {
        List<AuditLog> list = auditLogRepository.findAllByOrderByTimestampDesc();
        return list.stream()
                .filter(l -> category == null || category.isBlank() || category.equalsIgnoreCase("ALL") || (l.getCategory() != null && l.getCategory().equalsIgnoreCase(category)))
                .filter(l -> entityType == null || entityType.isBlank() || entityType.equalsIgnoreCase("ALL") || (l.getEntityType() != null && l.getEntityType().equalsIgnoreCase(entityType)))
                .filter(l -> {
                    if (search == null || search.isBlank()) return true;
                    String q = search.toLowerCase();
                    return (l.getAction() != null && l.getAction().toLowerCase().contains(q))
                            || (l.getActor() != null && l.getActor().toLowerCase().contains(q))
                            || (l.getDetails() != null && l.getDetails().toLowerCase().contains(q))
                            || (l.getHash() != null && l.getHash().toLowerCase().contains(q))
                            || (l.getEntityId() != null && l.getEntityId().toLowerCase().contains(q));
                })
                .toList();
    }

    public AuditLog logAction(
            Long incidentId,
            String action,
            String actor,
            String source,
            String details
    ) {
        return logAction(
                incidentId,
                incidentId != null ? "INCIDENT" : "GENERAL",
                incidentId != null ? String.valueOf(incidentId) : null,
                "INCIDENT_MANAGEMENT",
                action,
                actor,
                source,
                details
        );
    }

    public AuditLog logScanExecution(String scannerName, String executionType, String status, String details) {
        return logAction(
                null,
                "VULNERABILITY_SCAN",
                scannerName,
                "SECURITY_SCAN",
                status,
                "SYSTEM",
                executionType,
                details
        );
    }


    public synchronized AuditLog logAction(
            Long incidentId,
            String entityType,
            String entityId,
            String category,
            String action,
            String actor,
            String source,
            String details
    ) {
        String previousHash = auditLogRepository.findFirstByOrderByIdDesc()
                .map(AuditLog::getHash)
                .filter(h -> h != null && !h.isBlank())
                .orElse("0000000000000000000000000000000000000000000000000000000000000000");

        LocalDateTime timestamp = LocalDateTime.now().truncatedTo(ChronoUnit.MICROS);
        String target = (entityType != null ? entityType : "") + ":" + (entityId != null ? entityId : "");
        String hash = calculateHash(previousHash, timestamp, actor, action, target, details);

        AuditLog auditLog = new AuditLog(
                incidentId,
                entityType != null ? entityType : "GENERAL",
                entityId,
                category != null ? category : "SECURITY_EVENT",
                action,
                actor != null ? actor : "System",
                source != null ? source : "SentinelCore",
                timestamp,
                details,
                previousHash,
                hash
        );

        return auditLogRepository.save(auditLog);
    }

    public ChainVerificationResult verifyChainIntegrity() {
        List<AuditLog> logs = auditLogRepository.findAllByOrderByIdAsc();
        if (logs.isEmpty()) {
            return new ChainVerificationResult("VERIFIED", 0, false, "Audit chain is empty. No tampering detected.", LocalDateTime.now());
        }

        String expectedPreviousHash = "0000000000000000000000000000000000000000000000000000000000000000";
        for (int i = 0; i < logs.size(); i++) {
            AuditLog log = logs.get(i);
            if (log.getHash() == null) {
                // If legacy record without hash, accept and continue
                continue;
            }

            if (log.getPreviousHash() != null && !log.getPreviousHash().equalsIgnoreCase(expectedPreviousHash) && i > 0) {
                return new ChainVerificationResult(
                        "TAMPER_DETECTED",
                        logs.size(),
                        true,
                        "Tampering detected at log ID #" + log.getId() + ": Previous hash mismatch.",
                        LocalDateTime.now()
                );
            }

            String target = (log.getEntityType() != null ? log.getEntityType() : "") + ":" + (log.getEntityId() != null ? log.getEntityId() : "");
            String recalculated = calculateHash(log.getPreviousHash(), log.getTimestamp(), log.getActor(), log.getAction(), target, log.getDetails());
            if (!recalculated.equalsIgnoreCase(log.getHash())) {
                return new ChainVerificationResult(
                        "TAMPER_DETECTED",
                        logs.size(),
                        true,
                        "Tampering detected at log ID #" + log.getId() + ": Hash signature mismatch.",
                        LocalDateTime.now()
                );
            }

            expectedPreviousHash = log.getHash();
        }

        return new ChainVerificationResult(
                "VERIFIED",
                logs.size(),
                false,
                "All " + logs.size() + " audit records cryptographically verified. SHA-256 chain intact.",
                LocalDateTime.now()
        );
    }

    public AuditStats getAuditStats() {
        long count = auditLogRepository.count();
        ChainVerificationResult verification = verifyChainIntegrity();
        return new AuditStats(
                count,
                7,
                true,
                verification.status(),
                verification.tamperDetected(),
                verification.verifiedAt()
        );
    }

    public static String calculateHash(String previousHash, LocalDateTime timestamp, String actor, String action, String target, String details) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            String data = (previousHash != null ? previousHash : "0000000000000000000000000000000000000000000000000000000000000000")
                    + "|" + (timestamp != null ? timestamp.toString() : "")
                    + "|" + (actor != null ? actor : "")
                    + "|" + (action != null ? action : "")
                    + "|" + (target != null ? target : "")
                    + "|" + (details != null ? details : "");
            byte[] hashBytes = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hashBytes) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not available", e);
        }
    }
}