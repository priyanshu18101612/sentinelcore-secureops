package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.*;
import com.sentinelcore.sentinelcore_backend.repository.AlertRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
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
class CrossMilestoneCorrelationServiceTest {

    @Mock
    private PrometheusClientService prometheusClientService;

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private ComplianceFrameworkService complianceFrameworkService;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private LocalScanRunnerService localScanRunnerService;

    @InjectMocks
    private CrossMilestoneCorrelationService correlationService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(correlationService, "monitoredHostName", "LOCAL-WORKSTATION-HOST");
        ReflectionTestUtils.setField(correlationService, "cpuWarning", 90.0);
        ReflectionTestUtils.setField(correlationService, "cpuCritical", 95.0);
        ReflectionTestUtils.setField(correlationService, "memoryWarning", 90.0);
        ReflectionTestUtils.setField(correlationService, "memoryCritical", 95.0);
        ReflectionTestUtils.setField(correlationService, "diskWarning", 85.0);
        ReflectionTestUtils.setField(correlationService, "diskCritical", 92.0);
        ReflectionTestUtils.setField(correlationService, "latencyWarning", 50.0);
        ReflectionTestUtils.setField(correlationService, "latencyCritical", 100.0);
    }

    @Test
    void testGetHostCorrelationNominal() {
        TelemetryStatus tele = new TelemetryStatus();
        tele.setHostName("LOCAL-WORKSTATION-HOST");
        tele.setOsName("Windows 11");
        tele.setArchitecture("amd64");
        tele.setUptime("14:20 hrs");
        tele.setCurrentCpu(15.5);
        tele.setCurrentMemory(72.0);
        tele.setCurrentDisk(45.0);
        tele.setCurrentNetworkLatency(25.0);
        tele.setPrometheusConnected(true);
        tele.setWindowsExporterConnected(true);
        tele.setBlackboxExporterConnected(true);
        tele.setFallback(false);

        when(prometheusClientService.getTelemetryStatus()).thenReturn(tele);

        when(incidentRepository.findAll()).thenReturn(Collections.emptyList());
        when(vulnerabilityRepository.findAll()).thenReturn(Collections.emptyList());

        ComplianceFrameworkService.OverallComplianceSummary comp =
                new ComplianceFrameworkService.OverallComplianceSummary("COMPLIANT", 95.0, 3, 20, 19, 1, 0, LocalDateTime.now(), Collections.emptyList());
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(comp);

        AuditLogService.ChainVerificationResult chain =
                new AuditLogService.ChainVerificationResult("VERIFIED", 15, false, "Audit chain valid", LocalDateTime.now());
        when(auditLogService.verifyChainIntegrity()).thenReturn(chain);

        var response = correlationService.getHostCorrelation();

        assertNotNull(response);
        assertEquals("LOCAL-WORKSTATION-HOST", response.hostName());
        assertEquals("HEALTHY", response.hostOperationalStatus());
        assertNotNull(response.readinessScore());
        assertTrue(response.readinessScore().overallScore() >= 90.0);
        assertEquals(100.0, response.readinessScore().securityScore());
        assertEquals(95.0, response.readinessScore().complianceScore());
        assertEquals(100.0, response.readinessScore().infrastructureScore());
        assertTrue(response.readinessScore().calculationNote().contains("Proprietary SentinelCore Operational Readiness Index"));
    }

    @Test
    void testGetHostCorrelationWithDegradedTelemetryAndCriticalIncidents() {
        TelemetryStatus tele = new TelemetryStatus();
        tele.setHostName("LOCAL-WORKSTATION-HOST");
        tele.setCurrentCpu(96.0); // Critical
        tele.setCurrentMemory(97.0); // Critical
        tele.setCurrentDisk(93.0); // Critical
        tele.setCurrentNetworkLatency(150.0); // Critical
        tele.setPrometheusConnected(false); // Offline
        tele.setFallback(true);

        when(prometheusClientService.getTelemetryStatus()).thenReturn(tele);

        Incident critInc = new Incident();
        critInc.setId(10L);
        critInc.setIncidentId("INC-TEST-001");
        critInc.setTitle("Memory Critical");
        critInc.setSeverity(Severity.CRITICAL);
        critInc.setStatus(IncidentStatus.OPEN);

        when(incidentRepository.findAll()).thenReturn(List.of(critInc));

        Vulnerability critVuln = new Vulnerability();
        critVuln.setId(1L);
        critVuln.setCveId("CVE-2026-0001");
        critVuln.setSeverity(VulnerabilitySeverity.CRITICAL);
        when(vulnerabilityRepository.findAll()).thenReturn(List.of(critVuln));

        ComplianceFrameworkService.OverallComplianceSummary comp =
                new ComplianceFrameworkService.OverallComplianceSummary("ACTION_REQUIRED", 60.0, 3, 20, 12, 8, 0, LocalDateTime.now(), Collections.emptyList());
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(comp);

        AuditLogService.ChainVerificationResult chain =
                new AuditLogService.ChainVerificationResult("TAMPER_DETECTED", 15, true, "Tamper detected", LocalDateTime.now());
        when(auditLogService.verifyChainIntegrity()).thenReturn(chain);

        var response = correlationService.getHostCorrelation();

        assertNotNull(response);
        assertEquals("CRITICAL", response.hostOperationalStatus());
        // Deductions should heavily reduce the score
        assertTrue(response.readinessScore().securityScore() < 70.0);
        assertTrue(response.readinessScore().complianceScore() <= 35.0); // 60 - 25
        assertEquals(0.0, response.readinessScore().infrastructureScore());
        assertTrue(response.readinessScore().overallScore() < 50.0);
    }

    @Test
    void testConcurrentAuditPrevention() {
        // Mock dependencies for correlation
        TelemetryStatus tele = new TelemetryStatus();
        tele.setPrometheusConnected(true);
        when(prometheusClientService.getTelemetryStatus()).thenReturn(tele);
        when(incidentRepository.findAll()).thenReturn(Collections.emptyList());
        when(vulnerabilityRepository.findAll()).thenReturn(Collections.emptyList());
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(
                new ComplianceFrameworkService.OverallComplianceSummary("COMPLIANT", 100.0, 3, 20, 20, 0, 0, LocalDateTime.now(), Collections.emptyList()));
        when(auditLogService.verifyChainIntegrity()).thenReturn(
                new AuditLogService.ChainVerificationResult("VERIFIED", 5, false, "OK", LocalDateTime.now()));

        // Simulate long-running Trivy scan that triggers a second concurrent audit attempt
        when(localScanRunnerService.runLocalTrivyScan(any())).thenAnswer(invocation -> {
            // While first audit is running, attempt second audit
            Map<String, Object> concurrentAttempt = correlationService.runFullSystemAudit(null);
            assertEquals("ALREADY_RUNNING", concurrentAttempt.get("status"));
            assertTrue(((String) concurrentAttempt.get("message")).contains("currently in progress"));

            Map<String, Object> trivyMap = new LinkedHashMap<>();
            trivyMap.put("status", "SUCCESS");
            trivyMap.put("totalFindings", 3);
            trivyMap.put("savedFindings", 0);
            trivyMap.put("skippedDuplicates", 3);
            return trivyMap;
        });

        Map<String, Object> firstAudit = correlationService.runFullSystemAudit(null);
        assertEquals("SUCCESS", firstAudit.get("status"));
        assertFalse(correlationService.isAuditInProgress());
    }

    @Test
    void testRepeatedFullSystemAuditDoesNotCreateDuplicateVulnerabilities() {
        TelemetryStatus tele = new TelemetryStatus();
        tele.setPrometheusConnected(true);
        when(prometheusClientService.getTelemetryStatus()).thenReturn(tele);
        when(incidentRepository.findAll()).thenReturn(Collections.emptyList());

        // Existing 3 vulnerabilities in DB
        Vulnerability v1 = new Vulnerability(); v1.setCveId("CVE-2026-65182"); v1.setSeverity(VulnerabilitySeverity.CRITICAL);
        Vulnerability v2 = new Vulnerability(); v2.setCveId("CVE-2026-65905"); v2.setSeverity(VulnerabilitySeverity.CRITICAL);
        Vulnerability v3 = new Vulnerability(); v3.setCveId("CVE-2026-68525"); v3.setSeverity(VulnerabilitySeverity.CRITICAL);
        when(vulnerabilityRepository.findAll()).thenReturn(List.of(v1, v2, v3));

        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(
                new ComplianceFrameworkService.OverallComplianceSummary("COMPLIANT", 100.0, 3, 20, 20, 0, 0, LocalDateTime.now(), Collections.emptyList()));
        when(auditLogService.verifyChainIntegrity()).thenReturn(
                new AuditLogService.ChainVerificationResult("VERIFIED", 10, false, "OK", LocalDateTime.now()));

        // Mock Trivy scan result: always returns 3 total, 0 saved, 3 duplicates skipped
        Map<String, Object> trivyResult = new LinkedHashMap<>();
        trivyResult.put("status", "SUCCESS");
        trivyResult.put("totalFindings", 3);
        trivyResult.put("savedFindings", 0);
        trivyResult.put("skippedDuplicates", 3);
        when(localScanRunnerService.runLocalTrivyScan(any())).thenReturn(trivyResult);

        // Run 1
        Map<String, Object> run1 = correlationService.runFullSystemAudit(null);
        assertEquals("SUCCESS", run1.get("status"));
        Map<?, ?> summary1 = (Map<?, ?>) run1.get("trivyScanSummary");
        assertEquals(0, summary1.get("savedFindings"));
        assertEquals(3, summary1.get("skippedDuplicates"));

        // Run 2 (Repeated)
        Map<String, Object> run2 = correlationService.runFullSystemAudit(null);
        assertEquals("SUCCESS", run2.get("status"));
        Map<?, ?> summary2 = (Map<?, ?>) run2.get("trivyScanSummary");
        assertEquals(0, summary2.get("savedFindings"));
        assertEquals(3, summary2.get("skippedDuplicates"));

        // Verify audit logs were created for both runs
        verify(auditLogService, times(4)).logScanExecution(eq("Full System Audit"), anyString(), anyString(), anyString());
        // Verify zero incidents were created or modified
        verify(incidentRepository, never()).save(any());
    }
}
