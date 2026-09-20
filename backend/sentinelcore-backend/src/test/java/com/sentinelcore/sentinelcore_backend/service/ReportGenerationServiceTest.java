package com.sentinelcore.sentinelcore_backend.service;

import tools.jackson.databind.ObjectMapper;
import com.sentinelcore.sentinelcore_backend.model.*;
import com.sentinelcore.sentinelcore_backend.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportGenerationServiceTest {

    @Mock
    private SecurityReportRepository securityReportRepository;

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private AccessLogRepository accessLogRepository;

    @Mock
    private AuditLogRepository auditLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private ComplianceFrameworkService complianceFrameworkService;

    @Mock
    private SecurityReviewService securityReviewService;

    @Mock
    private CrossMilestoneCorrelationService correlationService;

    @InjectMocks
    private ReportGenerationService reportGenerationService;

    private CrossMilestoneCorrelationService.HostCorrelationResponse mockSnapshot;

    @BeforeEach
    void setUp() {
        var breakdown = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                88.0, 85.0, 90.0, 90.0, "Test Note"
        );
        mockSnapshot = new CrossMilestoneCorrelationService.HostCorrelationResponse(
                "LOCAL-WORKSTATION-HOST",
                "Windows 11",
                "48 hrs",
                "HEALTHY",
                Map.of("cpuUsagePercent", 22.5, "memoryUsagePercent", 55.0),
                Collections.emptyList(),
                Collections.emptyList(),
                Map.of("overallScore", 90.0),
                Map.of("status", "VERIFIED"),
                breakdown,
                LocalDateTime.now()
        );
    }

    @Test
    void testGenerateAttestationReport_SuccessAndDigest() throws Exception {
        when(correlationService.getHostCorrelation()).thenReturn(mockSnapshot);

        var compSummary = new ComplianceFrameworkService.OverallComplianceSummary(
                "COMPLIANT", 92.0, 3, 10, 10, 0, 0, LocalDateTime.now(), Collections.emptyList()
        );
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(compSummary);

        when(auditLogService.getAuditStats()).thenReturn(
                new AuditLogService.AuditStats(42L, 7, true, "VERIFIED", false, LocalDateTime.now())
        );

        when(auditLogRepository.findFirstByOrderByIdDesc()).thenReturn(Optional.empty());

        when(securityReportRepository.save(any(SecurityReport.class))).thenAnswer(invocation -> {
            SecurityReport r = invocation.getArgument(0);
            ReflectionTestUtils.setField(r, "id", 101L);
            return r;
        });

        SecurityReport generated = reportGenerationService.generateReport("DEVSECOPS_EXECUTIVE_ATTESTATION", "Audit Officer");

        assertNotNull(generated);
        assertEquals("DEVSECOPS_EXECUTIVE_ATTESTATION", generated.getReportType());
        assertEquals("READY", generated.getStatus());

        // Parse summary data JSON
        ObjectMapper mapper = new ObjectMapper();
        @SuppressWarnings("unchecked")
        Map<String, Object> data = mapper.readValue(generated.getSummaryData(), Map.class);

        assertNotNull(data.get("tamperEvidentIntegrityDigest"));
        String digest = (String) data.get("tamperEvidentIntegrityDigest");
        assertEquals(64, digest.length()); // 256 bits = 64 hex characters

        assertEquals("LOCAL-WORKSTATION-HOST", data.get("monitoredHost"));
        assertNotNull(data.get("complianceSummary"));
        assertNotNull(data.get("telemetrySnapshot"));

        // Verify that secrets/passwords are NOT in the payload
        String rawJson = generated.getSummaryData().toLowerCase();
        assertFalse(rawJson.contains("password"));
        assertFalse(rawJson.contains("secret"));
        assertFalse(rawJson.contains("bearer "));

        // Verify audit log call was recorded
        verify(auditLogService).logAction(
                isNull(),
                eq("REPORT"),
                eq("101"),
                eq("GOVERNANCE_REPORTING"),
                eq("AUDIT_ATTESTATION_GENERATED"),
                eq("Audit Officer"),
                eq("ReportGenerationService"),
                contains("Report ID #101")
        );
    }

    @Test
    void testVerifyAttestation_IntegrityVerified() {
        // Prepare canonical payload and real hash
        Map<String, Object> map = new TreeMap<>();
        map.put("monitoredHost", "LOCAL-WORKSTATION-HOST");
        map.put("reportType", "DEVSECOPS_EXECUTIVE_ATTESTATION");
        map.put("score", 90.0);

        // Precalculate hash
        String canonical = "{\"monitoredHost\":\"LOCAL-WORKSTATION-HOST\",\"reportType\":\"DEVSECOPS_EXECUTIVE_ATTESTATION\",\"score\":90.0}";
        String hash = ReportGenerationService.sha256Hex(canonical);
        map.put("tamperEvidentIntegrityDigest", hash);

        ObjectMapper mapper = new ObjectMapper();
        String json;
        try {
            json = mapper.writeValueAsString(map);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        SecurityReport report = new SecurityReport("DEVSECOPS_EXECUTIVE_ATTESTATION", "Attestation", "Auditor", LocalDateTime.now(), json, "READY");
        ReflectionTestUtils.setField(report, "id", 200L);

        when(securityReportRepository.findById(200L)).thenReturn(Optional.of(report));

        AuditLog matchingLog = new AuditLog();
        ReflectionTestUtils.setField(matchingLog, "id", 555L);
        matchingLog.setAction("AUDIT_ATTESTATION_GENERATED");
        matchingLog.setEntityType("REPORT");
        matchingLog.setEntityId("200");
        matchingLog.setHash("abc123auditloghash");

        when(auditLogRepository.findByEntityTypeOrderByTimestampDesc("REPORT")).thenReturn(List.of(matchingLog));

        ReportGenerationService.AttestationVerificationResult result = reportGenerationService.verifyAttestation(200L);

        assertNotNull(result);
        assertEquals("INTEGRITY_VERIFIED", result.status());
        assertFalse(result.isTampered());
        assertEquals(hash, result.storedDigest());
        assertEquals(hash, result.recalculatedDigest());
        assertTrue(result.auditLogChainBacked());
        assertEquals(555L, result.auditLogId());
    }

    @Test
    void testVerifyAttestation_TamperDetectedOnModifiedPayload() {
        // Stored hash does not match modified payload content
        Map<String, Object> map = new TreeMap<>();
        map.put("monitoredHost", "LOCAL-WORKSTATION-HOST");
        map.put("reportType", "DEVSECOPS_EXECUTIVE_ATTESTATION");
        map.put("score", 99.0); // Tampered score!
        map.put("tamperEvidentIntegrityDigest", "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"); // Old or bogus hash

        ObjectMapper mapper = new ObjectMapper();
        String json;
        try {
            json = mapper.writeValueAsString(map);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        SecurityReport report = new SecurityReport("DEVSECOPS_EXECUTIVE_ATTESTATION", "Attestation", "Auditor", LocalDateTime.now(), json, "READY");
        ReflectionTestUtils.setField(report, "id", 201L);

        when(securityReportRepository.findById(201L)).thenReturn(Optional.of(report));

        ReportGenerationService.AttestationVerificationResult result = reportGenerationService.verifyAttestation(201L);

        assertNotNull(result);
        assertEquals("TAMPER_DETECTED", result.status());
        assertTrue(result.isTampered());
        assertNotEquals(result.storedDigest(), result.recalculatedDigest());
    }
}
