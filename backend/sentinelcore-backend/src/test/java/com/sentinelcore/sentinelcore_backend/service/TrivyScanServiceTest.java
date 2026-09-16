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
class TrivyScanServiceTest {

    @Mock
    private VulnerabilityService vulnerabilityService;

    private TrivyScanService trivyScanService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        trivyScanService = new TrivyScanService(vulnerabilityService, objectMapper);
    }

    @Test
    void testProcessActualTrivyReport() throws Exception {
        // Read the actual trivy-results.json generated in the workspace
        File trivyFile = new File("../../trivy-results.json");
        if (!trivyFile.exists()) {
            trivyFile = new File("trivy-results.json");
        }
        if (!trivyFile.exists()) {
            trivyFile = new File("C:/Users/siriv/sentinelcore-secureops/trivy-results.json");
        }

        assertTrue(trivyFile.exists(), "trivy-results.json should exist in the repository root");
        byte[] fileBytes = Files.readAllBytes(trivyFile.toPath());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "trivy-results.json",
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

        Map<String, Object> result = trivyScanService.processTrivyReport(multipartFile);

        assertNotNull(result);
        assertEquals("Trivy scan report processed successfully", result.get("message"));
        assertEquals("Trivy", result.get("scanSource"));
        assertEquals(3, result.get("totalFindings"), "Should have exactly 3 total findings from trivy-results.json");
        assertEquals(3, result.get("savedFindings"), "Should have saved all 3 findings");
        assertEquals(0, result.get("skippedDuplicates"), "Should have 0 duplicates on first import");

        @SuppressWarnings("unchecked")
        List<Vulnerability> saved = (List<Vulnerability>) result.get("vulnerabilities");
        assertEquals(3, saved.size());

        // Verify finding 1: CVE-2026-65182
        Vulnerability v1 = saved.get(0);
        assertEquals("CVE-2026-65182", v1.getCveId());
        assertEquals("VULN-2026-001", v1.getVulnerabilityId());
        assertTrue(v1.getTitle().contains("Apache Tomcat"));
        assertEquals(VulnerabilitySeverity.CRITICAL, v1.getSeverity());
        assertEquals(9.1, v1.getCvssScore());
        assertEquals(9.1, v1.getRiskScore());
        assertEquals(1, v1.getAffectedAssets());
        assertEquals(0, v1.getPatchedAssets());
        assertEquals(1, v1.getPendingAssets());
        assertEquals(PatchStatus.PENDING, v1.getPatchStatus());
        assertEquals("Trivy", v1.getScanSource());

        // Verify finding 2: CVE-2026-65905
        Vulnerability v2 = saved.get(1);
        assertEquals("CVE-2026-65905", v2.getCveId());
        assertEquals(VulnerabilitySeverity.CRITICAL, v2.getSeverity());
        assertEquals(9.8, v2.getCvssScore());
        assertEquals(9.8, v2.getRiskScore());

        // Verify finding 3: CVE-2026-68525
        Vulnerability v3 = saved.get(2);
        assertEquals("CVE-2026-68525", v3.getCveId());
        assertEquals(VulnerabilitySeverity.CRITICAL, v3.getSeverity());
        assertEquals(9.1, v3.getCvssScore());

        verify(vulnerabilityService, times(3)).createVulnerability(any(Vulnerability.class));
    }

    @Test
    void testDuplicateProtection() throws Exception {
        File trivyFile = new File("C:/Users/siriv/sentinelcore-secureops/trivy-results.json");
        byte[] fileBytes = Files.readAllBytes(trivyFile.toPath());

        MockMultipartFile multipartFile = new MockMultipartFile(
                "file",
                "trivy-results.json",
                "application/json",
                fileBytes
        );

        // Pre-populate with existing CVE-2026-65182
        Vulnerability existing = new Vulnerability();
        existing.setId(10L);
        existing.setVulnerabilityId("VULN-2026-010");
        existing.setCveId("CVE-2026-65182");
        existing.setScanSource("Trivy");
        existing.setTitle("Existing Tomcat issue");

        when(vulnerabilityService.getAllVulnerabilities()).thenReturn(List.of(existing));
        when(vulnerabilityService.createVulnerability(any(Vulnerability.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Map<String, Object> result = trivyScanService.processTrivyReport(multipartFile);

        assertEquals(3, result.get("totalFindings"));
        assertEquals(2, result.get("savedFindings"), "Should only save 2 findings because 1 is a duplicate");
        assertEquals(1, result.get("skippedDuplicates"), "Should skip 1 duplicate");
        verify(vulnerabilityService, times(2)).createVulnerability(any(Vulnerability.class));
    }

    @Test
    void testEmptyReportThrowsException() {
        MockMultipartFile emptyFile = new MockMultipartFile("file", "empty.json", "application/json", new byte[0]);
        assertThrows(IllegalArgumentException.class, () -> trivyScanService.processTrivyReport(emptyFile));
    }

    @Test
    void testInvalidReportThrowsException() {
        MockMultipartFile invalidFile = new MockMultipartFile("file", "bad.json", "application/json", "{\"foo\":\"bar\"}".getBytes());
        assertThrows(IllegalArgumentException.class, () -> trivyScanService.processTrivyReport(invalidFile));
    }
}
