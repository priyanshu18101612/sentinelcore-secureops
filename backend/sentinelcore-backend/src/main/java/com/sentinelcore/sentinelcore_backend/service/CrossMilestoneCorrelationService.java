package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.TelemetryStatus;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.AlertRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class CrossMilestoneCorrelationService {

    private static final Logger log = LoggerFactory.getLogger(CrossMilestoneCorrelationService.class);

    private final PrometheusClientService prometheusClientService;
    private final AlertRepository alertRepository;
    private final IncidentRepository incidentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComplianceFrameworkService complianceFrameworkService;
    private final AuditLogService auditLogService;
    private final LocalScanRunnerService localScanRunnerService;

    // Atomic mutex to prevent concurrent full-system-audit runs
    private final AtomicBoolean isAuditRunning = new AtomicBoolean(false);

    @Value("${telemetry.host.asset-name:LOCAL-WORKSTATION-HOST}")
    private String monitoredHostName;

    @Value("${telemetry.thresholds.cpu-warning:90.0}")
    private double cpuWarning;

    @Value("${telemetry.thresholds.cpu-critical:95.0}")
    private double cpuCritical;

    @Value("${telemetry.thresholds.memory-warning:90.0}")
    private double memoryWarning;

    @Value("${telemetry.thresholds.memory-critical:95.0}")
    private double memoryCritical;

    @Value("${telemetry.thresholds.disk-warning:85.0}")
    private double diskWarning;

    @Value("${telemetry.thresholds.disk-critical:92.0}")
    private double diskCritical;

    @Value("${telemetry.thresholds.latency-warning:50.0}")
    private double latencyWarning;

    @Value("${telemetry.thresholds.latency-critical:100.0}")
    private double latencyCritical;

    public record UnifiedReadinessBreakdown(
            double overallScore,
            double securityScore,
            double complianceScore,
            double infrastructureScore,
            String calculationNote
    ) {}

    public record HostCorrelationResponse(
            String hostName,
            String osName,
            String uptime,
            String hostOperationalStatus,
            Map<String, Object> liveTelemetry,
            List<Map<String, Object>> activeIncidents,
            List<Map<String, Object>> activeVulnerabilities,
            Map<String, Object> complianceSummary,
            Map<String, Object> auditSummary,
            UnifiedReadinessBreakdown readinessScore,
            LocalDateTime generatedAt
    ) {}

    public CrossMilestoneCorrelationService(
            PrometheusClientService prometheusClientService,
            AlertRepository alertRepository,
            IncidentRepository incidentRepository,
            VulnerabilityRepository vulnerabilityRepository,
            ComplianceFrameworkService complianceFrameworkService,
            AuditLogService auditLogService,
            LocalScanRunnerService localScanRunnerService
    ) {
        this.prometheusClientService = prometheusClientService;
        this.alertRepository = alertRepository;
        this.incidentRepository = incidentRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.complianceFrameworkService = complianceFrameworkService;
        this.auditLogService = auditLogService;
        this.localScanRunnerService = localScanRunnerService;
    }

    public boolean isAuditInProgress() {
        return isAuditRunning.get();
    }

    public HostCorrelationResponse getHostCorrelation() {
        // 1. M1: Live Telemetry with graceful failure handling
        TelemetryStatus teleStatus;
        try {
            teleStatus = prometheusClientService.getTelemetryStatus();
        } catch (Exception e) {
            log.warn("Telemetry status retrieval failed: {}", e.getMessage());
            teleStatus = new TelemetryStatus();
            teleStatus.setHostName(monitoredHostName);
            teleStatus.setFallback(true);
            teleStatus.setFallbackReason("Prometheus telemetry client error: " + e.getMessage());
        }

        Map<String, Object> telemetryMap = new LinkedHashMap<>();
        telemetryMap.put("hostName", teleStatus.getHostName() != null ? teleStatus.getHostName() : monitoredHostName);
        telemetryMap.put("osName", teleStatus.getOsName());
        telemetryMap.put("architecture", teleStatus.getArchitecture());
        telemetryMap.put("uptime", teleStatus.getUptime());
        telemetryMap.put("cpuUsagePercent", teleStatus.getCurrentCpu());
        telemetryMap.put("memoryUsagePercent", teleStatus.getCurrentMemory());
        telemetryMap.put("diskUsagePercent", teleStatus.getCurrentDisk());
        telemetryMap.put("networkLatencyMs", teleStatus.getCurrentNetworkLatency());
        telemetryMap.put("networkInKbps", teleStatus.getCurrentNetworkIn());
        telemetryMap.put("networkOutKbps", teleStatus.getCurrentNetworkOut());
        telemetryMap.put("prometheusConnected", teleStatus.isPrometheusConnected());
        telemetryMap.put("windowsExporterConnected", teleStatus.isWindowsExporterConnected());
        telemetryMap.put("blackboxExporterConnected", teleStatus.isBlackboxExporterConnected());
        telemetryMap.put("fallback", teleStatus.isFallback());
        telemetryMap.put("fallbackReason", teleStatus.getFallbackReason());

        // 2. M2: Active Incidents
        List<Incident> allIncidents = incidentRepository.findAll();
        List<Incident> openIncidents = allIncidents.stream()
                .filter(i -> i.getStatus() != null && i.getStatus() != IncidentStatus.RESOLVED)
                .toList();

        List<Map<String, Object>> activeIncidentsList = openIncidents.stream().map(inc -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", inc.getId());
            map.put("incidentId", inc.getIncidentId());
            map.put("title", inc.getTitle());
            map.put("severity", inc.getSeverity() != null ? inc.getSeverity().name() : "UNKNOWN");
            map.put("status", inc.getStatus() != null ? inc.getStatus().name() : "UNKNOWN");
            map.put("assignedTeam", inc.getAssignedTeam());
            map.put("createdAt", inc.getCreatedAt());
            return map;
        }).toList();

        // 3. M3: Active Vulnerabilities on this host
        List<Vulnerability> allVulns = vulnerabilityRepository.findAll();
        List<Map<String, Object>> activeVulnsList = allVulns.stream().map(v -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", v.getId());
            map.put("vulnerabilityId", v.getVulnerabilityId());
            map.put("cveId", v.getCveId());
            map.put("title", v.getTitle());
            map.put("severity", v.getSeverity() != null ? v.getSeverity().name() : "UNKNOWN");
            map.put("cvssScore", v.getCvssScore());
            map.put("patchStatus", v.getPatchStatus() != null ? v.getPatchStatus().name() : "UNKNOWN");
            map.put("scanSource", v.getScanSource());
            return map;
        }).toList();

        // 4. M4: Compliance Summary with graceful fallback
        Map<String, Object> compMap = new LinkedHashMap<>();
        double compRatio = 100.0;
        try {
            ComplianceFrameworkService.OverallComplianceSummary comp = complianceFrameworkService.getFrameworksSummary();
            compRatio = comp.overallScore();
            compMap.put("overallStatus", comp.overallStatus());
            compMap.put("overallScore", comp.overallScore());
            compMap.put("passedControls", comp.passedControls());
            compMap.put("failedControls", comp.failedControls());
            compMap.put("totalControls", comp.totalControls());
        } catch (Exception e) {
            log.warn("Compliance summary evaluation failed: {}", e.getMessage());
            compMap.put("overallStatus", "DEGRADED");
            compMap.put("overallScore", 75.0);
            compMap.put("error", e.getMessage());
            compRatio = 75.0;
        }

        // 5. M4: Audit Chain Verification with graceful fallback
        Map<String, Object> auditMap = new LinkedHashMap<>();
        boolean tamperDetected = false;
        try {
            AuditLogService.ChainVerificationResult chain = auditLogService.verifyChainIntegrity();
            tamperDetected = chain.tamperDetected();
            auditMap.put("status", chain.status());
            auditMap.put("totalRecords", chain.totalRecords());
            auditMap.put("tamperDetected", chain.tamperDetected());
            auditMap.put("message", chain.message());
            auditMap.put("verifiedAt", chain.verifiedAt());
        } catch (Exception e) {
            log.warn("Audit chain verification failed: {}", e.getMessage());
            auditMap.put("status", "DEGRADED");
            auditMap.put("tamperDetected", false);
            auditMap.put("error", e.getMessage());
        }

        // 6. Compute Scores & Operational Status
        UnifiedReadinessBreakdown readiness = calculateReadinessScore(
                allVulns,
                openIncidents,
                compRatio,
                tamperDetected,
                teleStatus
        );

        String operationalStatus = determineOperationalStatus(teleStatus, openIncidents);

        return new HostCorrelationResponse(
                monitoredHostName,
                teleStatus.getOsName() != null ? teleStatus.getOsName() : "Windows",
                teleStatus.getUptime() != null ? teleStatus.getUptime() : "Unknown",
                operationalStatus,
                telemetryMap,
                activeIncidentsList,
                activeVulnsList,
                compMap,
                auditMap,
                readiness,
                LocalDateTime.now()
        );
    }

    public Map<String, Object> runFullSystemAudit(String customPath) {
        // Concurrency Guard
        if (!isAuditRunning.compareAndSet(false, true)) {
            Map<String, Object> busyResponse = new LinkedHashMap<>();
            busyResponse.put("status", "ALREADY_RUNNING");
            busyResponse.put("message", "A full system audit is currently in progress. Please wait for it to finish.");
            busyResponse.put("executionDurationMs", 0);
            return busyResponse;
        }

        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            log.info("Initiating Full System Health & Security Audit for host: {}", monitoredHostName);

            // 1. Audit Log: Started
            auditLogService.logScanExecution(
                    "Full System Audit",
                    "Cross-Milestone Coordinator",
                    "AUDIT_STARTED",
                    "Full System Health & Security Audit started for host: " + monitoredHostName
            );

            // 2. Telemetry Assessment Snapshot
            TelemetryStatus teleStatus;
            try {
                teleStatus = prometheusClientService.getTelemetryStatus();
            } catch (Exception e) {
                teleStatus = new TelemetryStatus();
                teleStatus.setFallback(true);
                teleStatus.setFallbackReason(e.getMessage());
            }

            // 3. Automated Trivy Live Filesystem Scan (reusing Phase 4 duplicate protection)
            Map<String, Object> trivyResult = localScanRunnerService.runLocalTrivyScan(customPath);

            // 4. Compliance Re-evaluation
            ComplianceFrameworkService.OverallComplianceSummary compSummary = complianceFrameworkService.getFrameworksSummary();

            // 5. SHA-256 Audit Chain Verification
            AuditLogService.ChainVerificationResult chainResult = auditLogService.verifyChainIntegrity();

            // 6. Compute Fresh Host Correlation & Readiness
            HostCorrelationResponse correlation = getHostCorrelation();

            long durationMs = System.currentTimeMillis() - startTime;

            // 7. Audit Log: Completed
            auditLogService.logScanExecution(
                    "Full System Audit",
                    "Cross-Milestone Coordinator",
                    "AUDIT_COMPLETED",
                    String.format("Full System Audit completed in %dms | URS: %.1f | Trivy: %s | Chain: %s",
                            durationMs,
                            correlation.readinessScore().overallScore(),
                            trivyResult.get("status"),
                            chainResult.status())
            );

            result.put("status", "SUCCESS");
            result.put("message", "Full System Health & Security Audit completed successfully");
            result.put("executionDurationMs", durationMs);
            result.put("monitoredHost", monitoredHostName);
            result.put("trivyScanSummary", trivyResult);
            result.put("complianceScore", compSummary.overallScore());
            result.put("auditChainStatus", chainResult.status());
            result.put("unifiedReadinessScore", correlation.readinessScore());
            result.put("hostOperationalStatus", correlation.hostOperationalStatus());
            result.put("timestamp", LocalDateTime.now());

        } catch (Exception e) {
            log.error("Error during full system audit: {}", e.getMessage(), e);
            auditLogService.logScanExecution(
                    "Full System Audit",
                    "Cross-Milestone Coordinator",
                    "AUDIT_FAILED",
                    "Full System Audit failed: " + e.getMessage()
            );
            result.put("status", "ERROR");
            result.put("message", "Audit failed: " + e.getMessage());
            result.put("executionDurationMs", System.currentTimeMillis() - startTime);
        } finally {
            isAuditRunning.set(false);
        }

        return result;
    }

    public UnifiedReadinessBreakdown calculateReadinessScore(
            List<Vulnerability> allVulns,
            List<Incident> openIncidents,
            double complianceScore,
            boolean auditTamperDetected,
            TelemetryStatus teleStatus
    ) {
        // A. Security Posture Score (0â€“100)
        long critVulns = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.CRITICAL).count();
        long highVulns = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.HIGH).count();
        long medVulns = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.MEDIUM).count();
        long lowVulns = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.LOW).count();

        long openCritIncidents = openIncidents.stream()
                .filter(i -> i.getSeverity() != null && "CRITICAL".equalsIgnoreCase(i.getSeverity().name()))
                .count();

        double deductionsSec = (critVulns * 20.0) + (highVulns * 10.0) + (medVulns * 3.0) + (lowVulns * 1.0) + (openCritIncidents * 15.0);
        double sSec = Math.max(0.0, 100.0 - deductionsSec);

        // B. Compliance & Governance Score (0â€“100)
        double sComp = Math.max(0.0, Math.min(100.0, complianceScore - (auditTamperDetected ? 25.0 : 0.0)));

        // C. Infrastructure Health Score (0â€“100)
        double infraPenalties = 0.0;
        if (teleStatus == null || teleStatus.isFallback() || !teleStatus.isPrometheusConnected()) {
            infraPenalties += 30.0;
        }

        if (teleStatus != null) {
            Double cpu = teleStatus.getCurrentCpu();
            if (cpu != null) {
                if (cpu >= cpuCritical) infraPenalties += 25.0;
                else if (cpu >= cpuWarning) infraPenalties += 15.0;
                else if (cpu >= 80.0) infraPenalties += 5.0;
            }

            Double mem = teleStatus.getCurrentMemory();
            if (mem != null) {
                if (mem >= memoryCritical) infraPenalties += 25.0;
                else if (mem >= memoryWarning) infraPenalties += 15.0;
                else if (mem >= 85.0) infraPenalties += 5.0;
            }

            Double disk = teleStatus.getCurrentDisk();
            if (disk != null) {
                if (disk >= diskCritical) infraPenalties += 25.0;
                else if (disk >= diskWarning) infraPenalties += 15.0;
            }

            Double lat = teleStatus.getCurrentNetworkLatency();
            if (lat == null) {
                infraPenalties += 10.0;
            } else {
                if (lat >= latencyCritical) infraPenalties += 25.0;
                else if (lat >= latencyWarning) infraPenalties += 15.0;
            }
        }

        double sInfra = Math.max(0.0, 100.0 - infraPenalties);

        // Weighted Overall Score (40% Sec, 30% Comp, 30% Infra)
        double weighted = (0.40 * sSec) + (0.30 * sComp) + (0.30 * sInfra);
        double roundedOverall = Math.round(weighted * 10.0) / 10.0;
        double roundedSec = Math.round(sSec * 10.0) / 10.0;
        double roundedComp = Math.round(sComp * 10.0) / 10.0;
        double roundedInfra = Math.round(sInfra * 10.0) / 10.0;

        String note = "Proprietary SentinelCore Operational Readiness Index (40% Security, 30% Compliance, 30% Infrastructure Health)";

        return new UnifiedReadinessBreakdown(roundedOverall, roundedSec, roundedComp, roundedInfra, note);
    }

    private String determineOperationalStatus(TelemetryStatus teleStatus, List<Incident> openIncidents) {
        boolean hasCritIncident = openIncidents.stream()
                .anyMatch(i -> i.getSeverity() != null && "CRITICAL".equalsIgnoreCase(i.getSeverity().name()));

        Double cpu = teleStatus != null ? teleStatus.getCurrentCpu() : null;
        Double mem = teleStatus != null ? teleStatus.getCurrentMemory() : null;
        Double lat = teleStatus != null ? teleStatus.getCurrentNetworkLatency() : null;

        if (hasCritIncident || (cpu != null && cpu >= cpuCritical) || (mem != null && mem >= memoryCritical) || (lat != null && lat >= latencyCritical)) {
            return "CRITICAL";
        }

        if (teleStatus == null || !teleStatus.isPrometheusConnected() || teleStatus.isFallback()) {
            return "DEGRADED";
        }

        if ((cpu != null && cpu >= cpuWarning) || (mem != null && mem >= memoryWarning) || (lat != null && lat >= latencyWarning)) {
            return "WARNING";
        }

        return "HEALTHY";
    }
}
