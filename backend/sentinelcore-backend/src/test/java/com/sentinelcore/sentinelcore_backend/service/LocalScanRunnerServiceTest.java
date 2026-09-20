package com.sentinelcore.sentinelcore_backend.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.File;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LocalScanRunnerServiceTest {

    @Mock
    private TrivyScanService trivyScanService;

    @Mock
    private AuditLogService auditLogService;

    private LocalScanRunnerService runnerService;

    @BeforeEach
    void setUp() {
        runnerService = new LocalScanRunnerService(trivyScanService, auditLogService);
        ReflectionTestUtils.setField(runnerService, "trivyEnabled", true);
        ReflectionTestUtils.setField(runnerService, "defaultTrivyScanPath", "");
        ReflectionTestUtils.setField(runnerService, "trivyTimeoutSeconds", 120);
        ReflectionTestUtils.setField(runnerService, "trivySkipDirs", "node_modules,.git,target,telemetry/bin");
        ReflectionTestUtils.setField(runnerService, "trivySeverity", "CRITICAL,HIGH,MEDIUM,LOW");
        ReflectionTestUtils.setField(runnerService, "sonarEnabled", true);
        ReflectionTestUtils.setField(runnerService, "sonarServerUrl", "http://localhost:9000");
        ReflectionTestUtils.setField(runnerService, "sonarProjectKey", "sentinelcore-secureops");
        ReflectionTestUtils.setField(runnerService, "sonarTimeoutSeconds", 120);
        ReflectionTestUtils.setField(runnerService, "monitoredHostName", "LOCAL-WORKSTATION-HOST");
    }

    @Test
    void testGetTrivyStatus() {
        Map<String, Object> status = runnerService.getTrivyStatus();
        assertNotNull(status);
        assertEquals("Aqua Trivy", status.get("tool"));
        assertEquals("Local CLI", status.get("scannerType"));
        assertEquals("LOCAL-WORKSTATION-HOST", status.get("monitoredHostSource"));
        assertNotNull(status.get("defaultScanPath"));
    }

    @Test
    void testGetSonarQubeStatus() {
        Map<String, Object> status = runnerService.getSonarQubeStatus();
        assertNotNull(status);
        assertEquals("SonarQube Scanner", status.get("tool"));
        assertEquals("http://localhost:9000", status.get("serverUrl"));
        assertEquals("sentinelcore-secureops", status.get("projectKey"));
        assertTrue("READY".equals(status.get("status")) || "NOT_CONFIGURED".equals(status.get("status")));
    }

    @Test
    void testRunLocalSonarScanWhenUnavailable() {
        if (!runnerService.isSonarScannerInstalled()) {
            Map<String, Object> result = runnerService.runLocalSonarScan(null);
            assertNotNull(result);
            assertEquals("OFFLINE", result.get("status"));
            assertNotNull(result.get("diagnostics"));
            verify(auditLogService, atLeastOnce()).logScanExecution(
                    eq("SonarQube"),
                    eq("SonarQube Scanner"),
                    eq("SCAN_NOT_CONFIGURED"),
                    anyString()
            );
        }
    }

    @Test
    void testResolveTargetDirectoryFallback() {
        File resolved = runnerService.resolveTargetDirectory(null);
        assertNotNull(resolved);
        assertTrue(resolved.exists());
    }

    @Test
    void testResolveTargetDirectoryCustomPath() {
        File temp = new File(System.getProperty("java.io.tmpdir"));
        File resolved = runnerService.resolveTargetDirectory(temp.getAbsolutePath());
        assertNotNull(resolved);
        assertEquals(temp.getAbsolutePath(), resolved.getAbsolutePath());
    }
}