package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DevSecOpsDashboardServiceTest {

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private ComplianceFrameworkService complianceFrameworkService;

    @InjectMocks
    private DevSecOpsDashboardService devSecOpsDashboardService;

    @Test
    void testGetPostureAggregatesCorrectly() {
        Vulnerability v1 = new Vulnerability();
        v1.setVulnerabilityId("VULN-TRIVY-1");
        v1.setSeverity(VulnerabilitySeverity.CRITICAL);
        v1.setScanSource("TRIVY_SCANNER");
        v1.setRiskScore(9.2);
        v1.setAffectedAssets(10);
        v1.setPatchedAssets(7);
        v1.setPendingAssets(3);

        Vulnerability v2 = new Vulnerability();
        v2.setVulnerabilityId("VULN-SONAR-1");
        v2.setSeverity(VulnerabilitySeverity.HIGH);
        v2.setScanSource("SONARQUBE");
        v2.setRiskScore(7.5);
        v2.setAffectedAssets(5);
        v2.setPatchedAssets(5);
        v2.setPendingAssets(0);

        when(vulnerabilityRepository.findAll()).thenReturn(List.of(v1, v2));

        Incident inc1 = new Incident();
        inc1.setStatus(IncidentStatus.OPEN);
        inc1.setSeverity(Severity.CRITICAL);
        when(incidentRepository.findAll()).thenReturn(List.of(inc1));

        ComplianceFrameworkService.OverallComplianceSummary mockComp = new ComplianceFrameworkService.OverallComplianceSummary(
                "COMPLIANT", 100.0, 3, 12, 12, 0, 0, LocalDateTime.now(), List.of()
        );
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(mockComp);

        DevSecOpsDashboardService.DevSecOpsPosture posture = devSecOpsDashboardService.getPosture();

        assertNotNull(posture);
        assertEquals(2, posture.totalVulnerabilities());
        assertEquals(1, posture.criticalVulnerabilities());
        assertEquals(1, posture.highVulnerabilities());
        assertEquals(1, posture.openIncidents());
        assertEquals(1, posture.criticalOrHighIncidents());

        // Scanner checks
        assertEquals(1, posture.trivyScanner().totalFindings());
        assertEquals("Trivy Container & SCA", posture.trivyScanner().scannerName());
        assertEquals(1, posture.sonarQubeScanner().totalFindings());
        assertEquals("SonarQube SAST", posture.sonarQubeScanner().scannerName());

        // Assets
        assertEquals(15, posture.totalAffectedAssets());
        assertEquals(12, posture.totalPatchedAssets());
        assertEquals(3, posture.totalPendingAssets());
        assertEquals(80.0, posture.patchComplianceRate());
    }
}
