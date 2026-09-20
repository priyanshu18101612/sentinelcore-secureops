package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.repository.AuditLogRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock
    private AuditLogRepository auditLogRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    @Test
    void testLogActionCreatesHashedRecord() {
        when(auditLogRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog log = auditLogService.logAction(
                100L,
                "INCIDENT",
                "100",
                "INCIDENT_MANAGEMENT",
                "STATUS_UPDATED",
                "Alex Vance",
                "WebUI",
                "Incident marked as INVESTIGATING"
        );

        assertNotNull(log);
        assertEquals("STATUS_UPDATED", log.getAction());
        assertEquals("Alex Vance", log.getActor());
        assertNotNull(log.getHash());
        assertEquals(64, log.getHash().length()); // Valid SHA-256 hex string length
        assertNotNull(log.getPreviousHash());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }

    @Test
    void testVerifyChainIntegrityWithValidChain() {
        LocalDateTime now = LocalDateTime.now();
        String genesisPrev = "0000000000000000000000000000000000000000000000000000000000000000";
        String hash1 = AuditLogService.calculateHash(genesisPrev, now, "Admin", "LOGIN", "AUTH:Admin", "Login success");
        AuditLog log1 = new AuditLog(null, "AUTH", "Admin", "ACCESS_CONTROL", "LOGIN", "Admin", "System", now, "Login success", genesisPrev, hash1);

        String hash2 = AuditLogService.calculateHash(hash1, now.plusMinutes(1), "Admin", "INCIDENT_CREATED", "INCIDENT:1", "Created incident");
        AuditLog log2 = new AuditLog(1L, "INCIDENT", "1", "INCIDENT_MANAGEMENT", "INCIDENT_CREATED", "Admin", "System", now.plusMinutes(1), "Created incident", hash1, hash2);

        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of(log1, log2));

        AuditLogService.ChainVerificationResult result = auditLogService.verifyChainIntegrity();

        assertEquals("VERIFIED", result.status());
        assertFalse(result.tamperDetected());
        assertEquals(2, result.totalRecords());
    }

    @Test
    void testVerifyChainIntegrityDetectsTampering() {
        LocalDateTime now = LocalDateTime.now();
        String genesisPrev = "0000000000000000000000000000000000000000000000000000000000000000";
        String hash1 = AuditLogService.calculateHash(genesisPrev, now, "Admin", "LOGIN", "AUTH:Admin", "Login success");
        AuditLog log1 = new AuditLog(null, "AUTH", "Admin", "ACCESS_CONTROL", "LOGIN", "Admin", "System", now, "Login success", genesisPrev, hash1);

        // Tampered log: details modified without updating hash
        AuditLog log2 = new AuditLog(1L, "INCIDENT", "1", "INCIDENT_MANAGEMENT", "INCIDENT_CREATED", "Admin", "System", now.plusMinutes(1), "TAMPERED DETAILS", hash1, "fake_hash_123");

        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of(log1, log2));

        AuditLogService.ChainVerificationResult result = auditLogService.verifyChainIntegrity();

        assertEquals("TAMPER_DETECTED", result.status());
        assertTrue(result.tamperDetected());
    }

    @Test
    void testGetAuditStats() {
        when(auditLogRepository.count()).thenReturn(42L);
        when(auditLogRepository.findAllByOrderByIdAsc()).thenReturn(List.of());

        AuditLogService.AuditStats stats = auditLogService.getAuditStats();

        assertEquals(42L, stats.totalLogs());
        assertEquals(7, stats.retentionYears());
        assertTrue(stats.encrypted());
        assertEquals("VERIFIED", stats.integrityStatus());
        assertFalse(stats.tamperDetected());
    }

    @Test
    void testLogScanExecution() {
        when(auditLogRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.empty());
        when(auditLogRepository.save(any(AuditLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AuditLog log = auditLogService.logScanExecution(
                "Aqua Trivy",
                "Aqua Trivy (Local CLI)",
                "LIVE_SCAN_COMPLETED",
                "Live Trivy scan completed in 1200ms on path: C:/repo | Total: 10 | Ingested: 10"
        );

        assertNotNull(log);
        assertEquals("VULNERABILITY_SCAN", log.getEntityType());
        assertEquals("Aqua Trivy", log.getEntityId());
        assertEquals("SECURITY_SCAN", log.getCategory());
        assertEquals("LIVE_SCAN_COMPLETED", log.getAction());
        assertEquals("SYSTEM", log.getActor());
        assertEquals("Aqua Trivy (Local CLI)", log.getSource());
        assertNotNull(log.getHash());
        verify(auditLogRepository, times(1)).save(any(AuditLog.class));
    }
}
