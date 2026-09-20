package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.*;
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
class RemediationAdvisoryServiceTest {

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private CrossMilestoneCorrelationService correlationService;

    @Mock
    private PrometheusClientService prometheusClientService;

    @Mock
    private ComplianceFrameworkService complianceFrameworkService;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private RemediationAdvisoryService remediationAdvisoryService;

    private CrossMilestoneCorrelationService.HostCorrelationResponse mockCorrelation;

    @BeforeEach
    void setUp() {
        var breakdown = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                75.0, 70.0, 80.0, 80.0, "Test Note"
        );
        mockCorrelation = new CrossMilestoneCorrelationService.HostCorrelationResponse(
                "LOCAL-WORKSTATION-HOST",
                "Windows 11",
                "24 hrs",
                "DEGRADED",
                Map.of("cpuUsagePercent", 20.0),
                Collections.emptyList(),
                Collections.emptyList(),
                Map.of("overallScore", 80.0),
                Map.of("status", "VERIFIED"),
                breakdown,
                LocalDateTime.now()
        );
    }

    @Test
    void testGenerateAdvisories_VulnerabilitiesAndIncidents() {
        when(correlationService.getHostCorrelation()).thenReturn(mockCorrelation);

        Vulnerability v1 = new Vulnerability();
        v1.setId(1L);
        v1.setVulnerabilityId("VULN-101");
        v1.setCveId("CVE-2026-65182");
        v1.setTitle("org.apache.tomcat.embed:tomcat-embed-core : DoS");
        v1.setSeverity(VulnerabilitySeverity.CRITICAL);
        v1.setCvssScore(9.8);
        v1.setScanSource("Trivy");
        v1.setDescription("Affected Package: org.apache.tomcat.embed:tomcat-embed-core\nupgrade to version 11.0.25, 10.1.58\nInstalledVersion: 11.0.24");

        Vulnerability v2 = new Vulnerability();
        v2.setId(2L);
        v2.setVulnerabilityId("VULN-102");
        v2.setCveId("CVE-2026-99999");
        v2.setTitle("custom-lib : Security Weakness");
        v2.setSeverity(VulnerabilitySeverity.MEDIUM);
        v2.setCvssScore(5.0);
        v2.setScanSource("SonarQube");
        v2.setDescription("SQL Injection flaw in custom-lib without specified upgrade");

        when(vulnerabilityRepository.findAll()).thenReturn(List.of(v1, v2));

        Incident inc = new Incident();
        ReflectionTestUtils.setField(inc, "id", 10L);
        inc.setIncidentId("INC-1001");
        inc.setTitle("Unauthorized DB Access Attempt");
        inc.setDescription("High volume login failures");
        inc.setSeverity(Severity.HIGH);
        inc.setStatus(IncidentStatus.OPEN);
        inc.setAssignedTeam("SecOps-Tier2");

        when(incidentRepository.findAll()).thenReturn(List.of(inc));

        var compSummary = new ComplianceFrameworkService.OverallComplianceSummary(
                "COMPLIANT", 85.0, 3, 10, 10, 0, 0, LocalDateTime.now(), Collections.emptyList()
        );
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(compSummary);

        when(auditLogService.verifyChainIntegrity()).thenReturn(
                new AuditLogService.ChainVerificationResult("VERIFIED", 50, false, "Clean", LocalDateTime.now())
        );

        when(prometheusClientService.getTelemetryStatus()).thenReturn(new TelemetryStatus());

        // Mock projected calculations
        var simulatedBreakdown1 = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                82.0, 85.0, 80.0, 80.0, "Projected"
        );
        var simulatedBreakdown2 = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                77.0, 73.0, 80.0, 80.0, "Projected"
        );
        var simulatedIncidentBreakdown = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                80.0, 80.0, 80.0, 80.0, "Projected"
        );
        var allCleanBreakdown = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                95.0, 100.0, 85.0, 100.0, "All Clean"
        );

        when(correlationService.calculateReadinessScore(anyList(), anyList(), anyDouble(), anyBoolean(), any(TelemetryStatus.class)))
                .thenReturn(simulatedBreakdown1)
                .thenReturn(simulatedBreakdown2)
                .thenReturn(simulatedIncidentBreakdown)
                .thenReturn(allCleanBreakdown);

        RemediationAdvisoryService.AdvisoryResponse response = remediationAdvisoryService.generateAdvisories();

        assertNotNull(response);
        assertEquals("LOCAL-WORKSTATION-HOST", response.monitoredHost());
        assertEquals(75.0, response.currentReadinessScore());
        assertTrue(response.totalPotentialRecovery() >= 0.0);
        assertEquals(3, response.totalAdvisories());

        // Check disclaimer
        assertTrue(response.disclaimer().contains("Informational remediation advisory only"));

        // Verify CRITICAL vulnerability advisory has extracted fixed version
        RemediationAdvisoryService.RemediationAdvisory vuln1Adv = response.advisories().stream()
                .filter(a -> "CVE-2026-65182".equals(a.cveId()))
                .findFirst()
                .orElse(null);
        assertNotNull(vuln1Adv);
        assertEquals("11.0.25, 10.1.58", vuln1Adv.fixedVersion());
        assertEquals("11.0.24", vuln1Adv.installedVersion());
        assertEquals("CRITICAL", vuln1Adv.severity());
        assertTrue(vuln1Adv.projectedScoreDelta() > 0.0);

        // Verify SonarQube vulnerability has "Not available" for fixed version
        RemediationAdvisoryService.RemediationAdvisory vuln2Adv = response.advisories().stream()
                .filter(a -> "CVE-2026-99999".equals(a.cveId()))
                .findFirst()
                .orElse(null);
        assertNotNull(vuln2Adv);
        assertEquals("Not available", vuln2Adv.fixedVersion());

        // Verify Incident advisory
        RemediationAdvisoryService.RemediationAdvisory incAdv = response.advisories().stream()
                .filter(a -> "INCIDENT".equals(a.category()))
                .findFirst()
                .orElse(null);
        assertNotNull(incAdv);
        assertEquals("INC-1001", incAdv.findingId());
        assertEquals("SecOps-Tier2", incAdv.component());
    }
}
