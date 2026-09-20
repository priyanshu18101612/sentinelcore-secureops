package com.sentinelcore.sentinelcore_backend.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.File;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class LocalScanRunnerService {

    private static final Logger log = LoggerFactory.getLogger(LocalScanRunnerService.class);

    private final TrivyScanService trivyScanService;
    private final AuditLogService auditLogService;

    @Value("${scanner.trivy.enabled:true}")
    private boolean trivyEnabled;

    @Value("${scanner.trivy.scan-path:}")
    private String defaultTrivyScanPath;

    @Value("${scanner.trivy.timeout-seconds:120}")
    private int trivyTimeoutSeconds;

    @Value("${scanner.trivy.skip-dirs:node_modules,.git,target,telemetry/bin}")
    private String trivySkipDirs;

    @Value("${scanner.trivy.severity:CRITICAL,HIGH,MEDIUM,LOW}")
    private String trivySeverity;

    @Value("${scanner.sonarqube.enabled:true}")
    private boolean sonarEnabled;

    @Value("${scanner.sonarqube.server-url:http://localhost:9000}")
    private String sonarServerUrl;

    @Value("${scanner.sonarqube.project-key:sentinelcore-secureops}")
    private String sonarProjectKey;

    @Value("${scanner.sonarqube.timeout-seconds:120}")
    private int sonarTimeoutSeconds;

    @Value("${telemetry.host.asset-name:LOCAL-WORKSTATION-HOST}")
    private String monitoredHostName;

    public LocalScanRunnerService(TrivyScanService trivyScanService, AuditLogService auditLogService) {
        this.trivyScanService = trivyScanService;
        this.auditLogService = auditLogService;
    }

    public boolean isTrivyInstalled() {
        try {
            Process process = new ProcessBuilder("trivy", "--version").start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public String getTrivyVersion() {
        try {
            Process process = new ProcessBuilder("trivy", "--version").start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            if (finished && process.exitValue() == 0) {
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line = reader.readLine();
                    if (line != null) {
                        return line.replace("Version:", "").trim();
                    }
                }
            }
        } catch (Exception ignored) {}
        return "Unknown";
    }

    public Map<String, Object> getTrivyStatus() {
        boolean installed = isTrivyInstalled();
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("installed", installed);
        status.put("tool", "Aqua Trivy");
        status.put("scannerType", "Local CLI");
        status.put("status", installed ? "READY" : "NOT_FOUND");
        status.put("version", installed ? getTrivyVersion() : null);
        status.put("defaultScanPath", resolveTargetDirectory(null).getAbsolutePath());
        status.put("skipDirs", trivySkipDirs);
        status.put("severityFilter", trivySeverity);
        status.put("monitoredHostSource", monitoredHostName);
        return status;
    }

    public boolean isSonarScannerInstalled() {
        try {
            Process process = new ProcessBuilder("sonar-scanner", "-v").start();
            boolean finished = process.waitFor(5, TimeUnit.SECONDS);
            return finished && process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    public Map<String, Object> getSonarQubeStatus() {
        boolean installed = isSonarScannerInstalled();
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("scannerInstalled", installed);
        status.put("tool", "SonarQube Scanner");
        status.put("scannerType", "Local CLI / Remote Server");
        status.put("serverUrl", sonarServerUrl);
        status.put("projectKey", sonarProjectKey);
        status.put("status", installed ? "READY" : "NOT_CONFIGURED");
        status.put("message", installed
                ? "SonarQube scanner CLI is installed and ready."
                : "SonarQube scanner (sonar-scanner) is not configured or offline. Live scans require a running SonarQube instance and sonar-scanner in PATH.");
        return status;
    }

    public File resolveTargetDirectory(String customPath) {
        if (customPath != null && !customPath.trim().isEmpty()) {
            File custom = new File(customPath.trim());
            if (custom.exists()) {
                return custom;
            }
        }

        if (defaultTrivyScanPath != null && !defaultTrivyScanPath.trim().isEmpty()) {
            File configured = new File(defaultTrivyScanPath.trim());
            if (configured.exists()) {
                return configured;
            }
        }

        // Walk up from current user.dir to locate repository root containing frontend and backend
        File current = new File(System.getProperty("user.dir"));
        File probe = current;
        while (probe != null) {
            if (new File(probe, "frontend").exists() && new File(probe, "backend").exists()) {
                return probe;
            }
            probe = probe.getParentFile();
        }

        // Fallback: if inside backend folder
        if (current.getName().equalsIgnoreCase("sentinelcore-backend")) {
            File parent = current.getParentFile();
            if (parent != null && parent.getParentFile() != null) {
                return parent.getParentFile();
            }
        }

        return current;
    }

    public Map<String, Object> runLocalTrivyScan(String targetPath) {
        Map<String, Object> result = new LinkedHashMap<>();
        File targetDir = resolveTargetDirectory(targetPath);
        long startTime = System.currentTimeMillis();

        if (!isTrivyInstalled()) {
            auditLogService.logScanExecution(
                    "Aqua Trivy",
                    "Aqua Trivy (Local CLI)",
                    "LIVE_SCAN_FAILED",
                    "Trivy CLI is not installed or not available on PATH. Scanned path: " + targetDir.getAbsolutePath()
            );
            result.put("status", "ERROR");
            result.put("error", "Trivy CLI is not installed or not available on the system PATH. Please ensure Trivy is installed.");
            result.put("scannedDirectory", targetDir.getAbsolutePath());
            return result;
        }

        // 1. Audit Log: Scan Started
        auditLogService.logScanExecution(
                "Aqua Trivy",
                "Aqua Trivy (Local CLI)",
                "LIVE_SCAN_STARTED",
                String.format("Live Trivy filesystem scan started on path: %s (Host: %s)", targetDir.getAbsolutePath(), monitoredHostName)
        );

        File tempOutputFile = null;
        try {
            tempOutputFile = File.createTempFile("sentinelcore-trivy-", ".json");

            log.info("Starting local Trivy security scan on path: {}", targetDir.getAbsolutePath());

            List<String> command = new ArrayList<>();
            command.add("trivy");
            command.add("fs");
            command.add("--format");
            command.add("json");
            command.add("--scanners");
            command.add("vuln");
            command.add("--quiet");

            if (trivySeverity != null && !trivySeverity.isBlank()) {
                command.add("--severity");
                command.add(trivySeverity.trim());
            }

            if (trivySkipDirs != null && !trivySkipDirs.isBlank()) {
                for (String dir : trivySkipDirs.split(",")) {
                    if (!dir.trim().isEmpty()) {
                        command.add("--skip-dirs");
                        command.add(dir.trim());
                    }
                }
            }

            command.add("--output");
            command.add(tempOutputFile.getAbsolutePath());
            command.add(targetDir.getAbsolutePath());

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder outputLog = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    outputLog.append(line).append("\n");
                }
            }

            int timeout = trivyTimeoutSeconds > 0 ? trivyTimeoutSeconds : 120;
            boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
            if (!finished) {
                process.destroyForcibly();
                auditLogService.logScanExecution(
                        "Aqua Trivy",
                        "Aqua Trivy (Local CLI)",
                        "LIVE_SCAN_TIMEOUT",
                        String.format("Trivy scan timed out after %d seconds on path: %s", timeout, targetDir.getAbsolutePath())
                );
                result.put("status", "TIMEOUT");
                result.put("error", "Trivy security scan timed out after " + timeout + " seconds.");
                result.put("scannedDirectory", targetDir.getAbsolutePath());
                return result;
            }

            if (!tempOutputFile.exists() || tempOutputFile.length() == 0) {
                auditLogService.logScanExecution(
                        "Aqua Trivy",
                        "Aqua Trivy (Local CLI)",
                        "LIVE_SCAN_FAILED",
                        "Trivy produced no output on path: " + targetDir.getAbsolutePath() + " | Log: " + outputLog
                );
                result.put("status", "ERROR");
                result.put("error", "Trivy did not produce scan results. Output: " + outputLog);
                result.put("scannedDirectory", targetDir.getAbsolutePath());
                return result;
            }

            String jsonContent = Files.readString(tempOutputFile.toPath());
            Map<String, Object> scanResults = trivyScanService.processTrivyJsonString(
                    jsonContent,
                    "Aqua Trivy (Local CLI)",
                    monitoredHostName
            );

            long durationMs = System.currentTimeMillis() - startTime;
            scanResults.put("status", "SUCCESS");
            scanResults.put("scanExecutionType", "LIVE_LOCAL_SYSTEM_SCAN");
            scanResults.put("scannedDirectory", targetDir.getAbsolutePath());
            scanResults.put("scannerTool", "Aqua Trivy (Local CLI)");
            scanResults.put("durationMs", durationMs);
            scanResults.put("monitoredHost", monitoredHostName);

            // 2. Audit Log: Scan Completed
            auditLogService.logScanExecution(
                    "Aqua Trivy",
                    "Aqua Trivy (Local CLI)",
                    "LIVE_SCAN_COMPLETED",
                    String.format("Live Trivy scan completed in %dms on path: %s | Total: %s | Ingested: %s | Duplicates: %s | Monitored Host: %s",
                            durationMs,
                            targetDir.getAbsolutePath(),
                            scanResults.get("totalFindings"),
                            scanResults.get("savedFindings"),
                            scanResults.get("skippedDuplicates"),
                            monitoredHostName
                    )
            );

            return scanResults;

        } catch (Exception e) {
            log.error("Failed to execute local Trivy scan: {}", e.getMessage(), e);
            auditLogService.logScanExecution(
                    "Aqua Trivy",
                    "Aqua Trivy (Local CLI)",
                    "LIVE_SCAN_FAILED",
                    "Exception during Trivy scan on " + targetDir.getAbsolutePath() + ": " + e.getMessage()
            );
            result.put("status", "ERROR");
            result.put("error", "Failed to execute Trivy scan: " + e.getMessage());
            result.put("scannedDirectory", targetDir.getAbsolutePath());
            return result;
        } finally {
            if (tempOutputFile != null && tempOutputFile.exists()) {
                try {
                    Files.deleteIfExists(tempOutputFile.toPath());
                } catch (Exception ignored) {
                }
            }
        }
    }

    public Map<String, Object> runLocalSonarScan(String targetPath) {
        File targetDir = resolveTargetDirectory(targetPath);
        Map<String, Object> result = new LinkedHashMap<>();

        if (!isSonarScannerInstalled()) {
            auditLogService.logScanExecution(
                    "SonarQube",
                    "SonarQube Scanner",
                    "SCAN_NOT_CONFIGURED",
                    String.format("SonarQube scan requested but scanner is OFFLINE / NOT_CONFIGURED. Scanned path: %s", targetDir.getAbsolutePath())
            );

            result.put("status", "OFFLINE");
            result.put("scannerType", "SonarQube Scanner");
            result.put("tool", "SonarQube Scanner");
            result.put("message", "SonarQube scanner (sonar-scanner) is OFFLINE or NOT_CONFIGURED. No automated installation was attempted per system safeguards.");
            result.put("scannedDirectory", targetDir.getAbsolutePath());
            result.put("diagnostics", Map.of(
                    "scannerInstalled", false,
                    "serverUrl", sonarServerUrl,
                    "projectKey", sonarProjectKey,
                    "recommendation", "To run live SonarQube scans, launch your SonarQube server and configure sonar-scanner on your PATH, or use manual report upload (/api/scans/sonarqube)."
            ));
            return result;
        }

        // If scanner is installed, run sonar-scanner against the project directory
        long startTime = System.currentTimeMillis();
        auditLogService.logScanExecution(
                "SonarQube",
                "SonarQube Scanner",
                "LIVE_SCAN_STARTED",
                String.format("Live SonarQube scan started on path: %s (Server: %s)", targetDir.getAbsolutePath(), sonarServerUrl)
        );

        try {
            ProcessBuilder pb = new ProcessBuilder(
                    "sonar-scanner",
                    "-Dsonar.projectKey=" + sonarProjectKey,
                    "-Dsonar.sources=.",
                    "-Dsonar.host.url=" + sonarServerUrl
            );
            pb.directory(targetDir);
            pb.redirectErrorStream(true);
            Process process = pb.start();

            StringBuilder outputLog = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    outputLog.append(line).append("\n");
                }
            }

            int timeout = sonarTimeoutSeconds > 0 ? sonarTimeoutSeconds : 120;
            boolean finished = process.waitFor(timeout, TimeUnit.SECONDS);
            long durationMs = System.currentTimeMillis() - startTime;

            if (!finished) {
                process.destroyForcibly();
                auditLogService.logScanExecution(
                        "SonarQube",
                        "SonarQube Scanner",
                        "LIVE_SCAN_TIMEOUT",
                        String.format("SonarQube scan timed out after %d seconds on path: %s", timeout, targetDir.getAbsolutePath())
                );
                result.put("status", "TIMEOUT");
                result.put("error", "SonarQube scan timed out after " + timeout + " seconds.");
                result.put("scannedDirectory", targetDir.getAbsolutePath());
                return result;
            }

            int exitCode = process.exitValue();
            if (exitCode != 0) {
                auditLogService.logScanExecution(
                        "SonarQube",
                        "SonarQube Scanner",
                        "LIVE_SCAN_FAILED",
                        String.format("SonarQube scanner exited with code %d on path: %s | Output: %s", exitCode, targetDir.getAbsolutePath(), outputLog)
                );
                result.put("status", "ERROR");
                result.put("error", "SonarQube scan failed with exit code " + exitCode + ": " + outputLog);
                result.put("scannedDirectory", targetDir.getAbsolutePath());
                return result;
            }

            auditLogService.logScanExecution(
                    "SonarQube",
                    "SonarQube Scanner",
                    "LIVE_SCAN_COMPLETED",
                    String.format("Live SonarQube scan completed in %dms on path: %s", durationMs, targetDir.getAbsolutePath())
            );

            result.put("status", "SUCCESS");
            result.put("scannerTool", "SonarQube Scanner");
            result.put("durationMs", durationMs);
            result.put("scannedDirectory", targetDir.getAbsolutePath());
            result.put("serverUrl", sonarServerUrl);
            result.put("output", outputLog.toString());
            return result;

        } catch (Exception e) {
            log.error("Failed to execute SonarQube scan: {}", e.getMessage(), e);
            auditLogService.logScanExecution(
                    "SonarQube",
                    "SonarQube Scanner",
                    "LIVE_SCAN_FAILED",
                    "Exception during SonarQube scan: " + e.getMessage()
            );
            result.put("status", "ERROR");
            result.put("error", "Failed to execute SonarQube scan: " + e.getMessage());
            result.put("scannedDirectory", targetDir.getAbsolutePath());
            return result;
        }
    }
}
