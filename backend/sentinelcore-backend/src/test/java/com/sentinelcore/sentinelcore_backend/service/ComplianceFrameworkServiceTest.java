package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.ComplianceControl;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.ComplianceControlRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplianceFrameworkServiceTest {

    @Mock
    private ComplianceControlRepository complianceControlRepository;

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Mock
    private AccessLogRepository accessLogRepository;

    @InjectMocks
    private ComplianceFrameworkService complianceFrameworkService;

    private List<ComplianceControl> sampleControls;

    @BeforeEach
    void setUp() {
        sampleControls = new ArrayList<>(List.of(
                new ComplianceControl("PCI_DSS", "PCI-6.2", "Deploy Patches", "Vulnerability", "Desc", "PENDING", LocalDateTime.now(), null),
                new ComplianceControl("PCI_DSS", "PCI-10.1", "Audit Integrity", "Audit", "Desc", "PENDING", LocalDateTime.now(), null),
                new ComplianceControl("SOC_2", "SOC2-CC6.1", "Access Control", "Access", "Desc", "PENDING", LocalDateTime.now(), null),
                new ComplianceControl("ISO_27001", "ISO-A.12.6.1", "Vuln Mgmt", "InfoSec", "Desc", "PENDING", LocalDateTime.now(), null)
        ));
    }

    @Test
    void testEvaluateAllFrameworksWhenClean() {
        when(complianceControlRepository.findAllByOrderByFrameworkAscControlIdAsc()).thenReturn(sampleControls);
        when(vulnerabilityRepository.findAll()).thenReturn(List.of());
        when(incidentRepository.findAll()).thenReturn(List.of());
        when(auditLogService.verifyChainIntegrity()).thenReturn(
                new AuditLogService.ChainVerificationResult("VERIFIED", 5, false, "Intact", LocalDateTime.now())
        );
        when(accessLogRepository.count()).thenReturn(10L);
        when(accessLogRepository.countByStatus("FAILED")).thenReturn(0L);

        ComplianceFrameworkService.OverallComplianceSummary summary = complianceFrameworkService.evaluateAllFrameworks();

        assertNotNull(summary);
        assertEquals(3, summary.totalFrameworks());
        assertEquals("COMPLIANT", summary.overallStatus());
        assertEquals(100.0, summary.overallScore());
        verify(auditLogService, times(1)).logAction(any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void testEvaluateAllFrameworksFailsWhenCriticalVulnerabilitiesUnpatched() {
        Vulnerability criticalVuln = new Vulnerability();
        criticalVuln.setSeverity(VulnerabilitySeverity.CRITICAL);
        criticalVuln.setPendingAssets(5); // 5 pending assets unpatched!

        when(complianceControlRepository.findAllByOrderByFrameworkAscControlIdAsc()).thenReturn(sampleControls);
        when(vulnerabilityRepository.findAll()).thenReturn(List.of(criticalVuln));
        when(incidentRepository.findAll()).thenReturn(List.of());
        when(auditLogService.verifyChainIntegrity()).thenReturn(
                new AuditLogService.ChainVerificationResult("VERIFIED", 5, false, "Intact", LocalDateTime.now())
        );
        when(accessLogRepository.count()).thenReturn(10L);
        when(accessLogRepository.countByStatus("FAILED")).thenReturn(0L);

        ComplianceFrameworkService.OverallComplianceSummary summary = complianceFrameworkService.evaluateAllFrameworks();

        assertNotNull(summary);
        assertEquals("NON_COMPLIANT", summary.overallStatus());
        assertTrue(summary.failedControls() > 0);

        ComplianceControl pciControl = sampleControls.stream()
                .filter(c -> "PCI-6.2".equals(c.getControlId()))
                .findFirst()
                .orElseThrow();
        assertEquals("FAILED", pciControl.getStatus());
        assertTrue(pciControl.getEvidenceSummary().contains("Violation"));
    }
}
