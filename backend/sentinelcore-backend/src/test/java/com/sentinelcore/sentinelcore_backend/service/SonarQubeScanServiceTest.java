package com.sentinelcore.sentinelcore_backend.service;

import tools.jackson.databind.ObjectMapper;
import com.sentinelcore.sentinelcore_backend.model.PatchStatus;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import java.io.File;
import java.nio.file.Files;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SonarQubeScanServiceTest {

    @Mock
    private VulnerabilityService vulnerabilityService;

    private SonarQubeScanService sonarQubeScanService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        sonarQubeScanService = new SonarQubeScanService(vulnerabilityService, objectMapper);
    }

    @Test
    void testProcessActualSonarQubeReport() throws Exception {
        File sonarFile = new File("../../sonarqube-issues.json");
        if (!sonarFile.exists()) {
            sonarFile = new File("sonarqube-issues.json");
        }
        if (!sonarFile.exists()) {
            sonarFile = new File("C:/Users/siriv/sentinelcore-secureops/sonarqube-issues.json");
        }

        assertTrue(sonarFile.exists(), "sonarqube-issues.json should exist in the repository root");
        byte[] fileBytes = Files.readAllBytes(sonarFile.toPath());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sonarqube-issues.json",
                "application/json",
                fileBytes
        );

        when(vulnerabilityService.getAllVulnerabilities()).thenReturn(Collections.emptyList());

        List<Vulnerability> capturedList = new ArrayList<>();
        long idCounter = 1L;
        when(vulnerabilityService.createVulnerability(any(Vulnerability.class))).thenAnswer(invocation -> {
            Vulnerability arg = invocation.getArgument(0);
            arg.setId(idCounter + capturedList.size());
            arg.setVulnerabilityId(String.format("VULN-2026-%03d", arg.getId()));
            capturedList.add(arg);
            return arg;
        });

        Map<String, Object> result = sonarQubeScanService.processSonarQubeReport(multipartFile);

        assertNotNull(result);
        assertEquals("SonarQube scan report processed successfully", result.get("message"));
        assertEquals("SonarQube", result.get("scanSource"));
        assertEquals(5, result.get("totalFindings"), "Should have exactly 5 total findings from sonarqube-issues.json");
        assertEquals(5, result.get("savedFindings"), "Should save all 5 findings");
        assertEquals(0, result.get("skippedDuplicates"), "Should have 0 duplicates on initial import");

        @SuppressWarnings("unchecked")
        List<Vulnerability> saved = (List<Vulnerability>) result.get("vulnerabilities");
        assertEquals(5, saved.size());

        // 1. BLOCKER finding (SQL injection)
        Vulnerability v1 = saved.get(0);
        assertEquals("CWE-89", v1.getCveId());
        assertTrue(v1.getTitle().contains("SQL injection"));
        assertEquals(VulnerabilitySeverity.CRITICAL, v1.getSeverity(), "BLOCKER should map to CRITICAL");
        assertEquals(9.5, v1.getCvssScore(), "BLOCKER should have CVSS 9.5");
        assertEquals(9.5, v1.getRiskScore());
        assertEquals(1, v1.getAffectedAssets());
        assertEquals(0, v1.getPatchedAssets());
        assertEquals(1, v1.getPendingAssets());
        assertEquals(PatchStatus.PENDING, v1.getPatchStatus());
        assertEquals("SonarQube", v1.getScanSource());
        assertNotNull(v1.getDetectedAt(), "creationDate should be parsed into detectedAt");
        assertTrue(v1.getDescription().contains("Line 42"));

        // 2. CRITICAL finding (hardcoded credential)
        Vulnerability v2 = saved.get(1);
        assertEquals("CWE-798", v2.getCveId());
        assertTrue(v2.getTitle().contains("password"));
        assertEquals(VulnerabilitySeverity.CRITICAL, v2.getSeverity(), "CRITICAL should map to CRITICAL");
        assertEquals(8.5, v2.getCvssScore(), "CRITICAL should have CVSS 8.5");
        assertEquals(8.5, v2.getRiskScore());

        // 3. MAJOR finding (XSS)
        Vulnerability v3 = saved.get(2);
        assertEquals("CWE-79", v3.getCveId());
        assertTrue(v3.getTitle().contains("Cross-Site Scripting"));
        assertEquals(VulnerabilitySeverity.HIGH, v3.getSeverity(), "MAJOR should map to HIGH");
        assertEquals(6.5, v3.getCvssScore(), "MAJOR should have CVSS 6.5");
        assertEquals(6.5, v3.getRiskScore());

        // 4. MINOR finding (weak crypto)
        Vulnerability v4 = saved.get(3);
        assertEquals("CWE-327", v4.getCveId());
        assertTrue(v4.getTitle().contains("Weak cryptography"));
        assertEquals(VulnerabilitySeverity.MEDIUM, v4.getSeverity(), "MINOR should map to MEDIUM");
        assertEquals(4.0, v4.getCvssScore(), "MINOR should have CVSS 4.0");
        assertEquals(4.0, v4.getRiskScore());

        // 5. INFO finding (hardcoded IP)
        Vulnerability v5 = saved.get(4);
        assertEquals("CWE-1188", v5.getCveId());
        assertTrue(v5.getTitle().contains("hardcoded IP"));
        assertEquals(VulnerabilitySeverity.LOW, v5.getSeverity(), "INFO should map to LOW");
        assertEquals(2.0, v5.getCvssScore(), "INFO should have CVSS 2.0");
        assertEquals(2.0, v5.getRiskScore());

        verify(vulnerabilityService, times(5)).createVulnerability(any(Vulnerability.class));
    }

    @Test
    void testDuplicateProtection() throws Exception {
        File sonarFile = new File("C:/Users/siriv/sentinelcore-secureops/sonarqube-issues.json");
        byte[] fileBytes = Files.readAllBytes(sonarFile.toPath());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "sonarqube-issues.json",
                "application/json",
                fileBytes
        );

        // Pre-populate with existing AY1aBcD-0001
        Vulnerability existing = new Vulnerability();
        existing.setId(20L);
        existing.setVulnerabilityId("VULN-2026-020");
        existing.setCveId("CWE-89");
        existing.setScanSource("SonarQube");
        existing.setTitle("Existing SQL injection");
        existing.setDescription("Rule: java:S2077 | File: backend/sentinelcore-backend/src/main/java/com/sentinelcore/sentinelcore_backend/repository/VulnerabilityRepository.java (Line 42)\nIssue Key: AY1aBcD-0001\n\nSQL injection");

        when(vulnerabilityService.getAllVulnerabilities()).thenReturn(List.of(existing));
        when(vulnerabilityService.createVulnerability(any(Vulnerability.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = sonarQubeScanService.processSonarQubeReport(multipartFile);

        assertEquals(5, result.get("totalFindings"));
        assertEquals(4, result.get("savedFindings"), "Should only save 4 findings because 1 is a duplicate");
        assertEquals(1, result.get("skippedDuplicates"), "Should skip 1 duplicate");
        verify(vulnerabilityService, times(4)).createVulnerability(any(Vulnerability.class));
    }

    @Test
    void testEmptyReportThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.json", "application/json", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> sonarQubeScanService.processSonarQubeReport(emptyFile));
    }

    @Test
    void testInvalidReportThrowsException() {
        MockMultipartFile invalidFile = new MockMultipartFile("file", "bad.json", "application/json", "{\"foo\":\"bar\"}".getBytes());
        assertThrows(IllegalArgumentException.class, () -> sonarQubeScanService.processSonarQubeReport(invalidFile));
    }

    @Test
    void testEmptyIssuesArrayThrowsException() {
        MockMultipartFile emptyIssues = new MockMultipartFile("file", "no-issues.json", "application/json", "{\"issues\":[]}".getBytes());
        assertThrows(IllegalArgumentException.class, () -> sonarQubeScanService.processSonarQubeReport(emptyIssues));
    }
}
