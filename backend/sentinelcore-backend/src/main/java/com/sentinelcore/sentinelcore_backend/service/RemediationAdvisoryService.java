package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.TelemetryStatus;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RemediationAdvisoryService {

    private static final Logger log = LoggerFactory.getLogger(RemediationAdvisoryService.class);

    private final VulnerabilityRepository vulnerabilityRepository;
    private final IncidentRepository incidentRepository;
    private final CrossMilestoneCorrelationService correlationService;
    private final PrometheusClientService prometheusClientService;
    private final ComplianceFrameworkService complianceFrameworkService;
    private final AuditLogService auditLogService;

    // Pattern to detect version recommendation in Trivy descriptions (e.g., "upgrade to version 11.0.25", "fixed in 1.2.3")
    private static final Pattern FIXED_VERSION_PATTERN = Pattern.compile(
            "(?:upgrade to version|fixed in|patched in|fixes the issue in|available in version)\\s+([0-9a-zA-Z_\\., \\t\\-]+)",
            Pattern.CASE_INSENSITIVE
    );

    public RemediationAdvisoryService(
            VulnerabilityRepository vulnerabilityRepository,
            IncidentRepository incidentRepository,
            CrossMilestoneCorrelationService correlationService,
            PrometheusClientService prometheusClientService,
            ComplianceFrameworkService complianceFrameworkService,
            AuditLogService auditLogService
    ) {
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.incidentRepository = incidentRepository;
        this.correlationService = correlationService;
        this.prometheusClientService = prometheusClientService;
        this.complianceFrameworkService = complianceFrameworkService;
        this.auditLogService = auditLogService;
    }

    public record RemediationAdvisory(
            String id,
            String findingId,
            String cveId,
            String title,
            String severity,
            String scanSource,
            String component,
            String installedVersion,
            String fixedVersion,
            String riskSummary,
            String remediationAction,
            double currentReadinessScore,
            double projectedReadinessScore,
            double projectedScoreDelta,
            String category
    ) {}

    public record AdvisoryResponse(
            String monitoredHost,
            double currentReadinessScore,
            double totalPotentialRecovery,
            int totalAdvisories,
            List<RemediationAdvisory> advisories,
            String disclaimer
    ) {}

    public AdvisoryResponse generateAdvisories() {
        // 1. Single snapshot of current host state & correlation
        CrossMilestoneCorrelationService.HostCorrelationResponse correlation = correlationService.getHostCorrelation();
        double currentScore = correlation.readinessScore() != null ? correlation.readinessScore().overallScore() : 0.0;
        String host = correlation.hostName() != null ? correlation.hostName() : "LOCAL-WORKSTATION-HOST";

        List<Vulnerability> allVulns = vulnerabilityRepository.findAll();
        List<Incident> allIncidents = incidentRepository.findAll();
        List<Incident> openIncidents = allIncidents.stream()
                .filter(i -> i.getStatus() != null && i.getStatus() != IncidentStatus.RESOLVED)
                .toList();

        ComplianceFrameworkService.OverallComplianceSummary compSummary = complianceFrameworkService.getFrameworksSummary();
        double compRatio = compSummary != null ? compSummary.overallScore() : 50.0;
        boolean auditTampered = auditLogService.verifyChainIntegrity().tamperDetected();

        TelemetryStatus teleStatus;
        try {
            teleStatus = prometheusClientService.getTelemetryStatus();
        } catch (Exception e) {
            teleStatus = new TelemetryStatus();
            teleStatus.setFallback(true);
            teleStatus.setFallbackReason(e.getMessage());
        }

        List<RemediationAdvisory> advisories = new ArrayList<>();

        // 2. Build advisories for active Vulnerabilities
        for (Vulnerability v : allVulns) {
            String component = extractComponent(v);
            String installedVer = extractInstalledVersion(v);
            String fixedVer = extractFixedVersion(v);

            // Compute exact projected score recovery using Phase 5 calculation code
            List<Vulnerability> simulatedVulns = allVulns.stream()
                    .filter(item -> !item.getId().equals(v.getId()))
                    .toList();

            CrossMilestoneCorrelationService.UnifiedReadinessBreakdown simulated =
                    correlationService.calculateReadinessScore(simulatedVulns, openIncidents, compRatio, auditTampered, teleStatus);

            double projectedScore = simulated.overallScore();
            double scoreDelta = Math.max(0.0, Math.round((projectedScore - currentScore) * 10.0) / 10.0);

            String action = generateVulnerabilityAction(v, component, fixedVer);

            advisories.add(new RemediationAdvisory(
                    "ADV-VULN-" + v.getId(),
                    v.getVulnerabilityId() != null ? v.getVulnerabilityId() : "VULN-" + v.getId(),
                    v.getCveId() != null ? v.getCveId() : "N/A",
                    v.getTitle() != null ? v.getTitle() : "Unspecified Vulnerability",
                    v.getSeverity() != null ? v.getSeverity().name() : "LOW",
                    v.getScanSource() != null ? v.getScanSource() : "Unknown",
                    component,
                    installedVer,
                    fixedVer,
                    v.getDescription() != null && v.getDescription().length() > 200
                            ? v.getDescription().substring(0, 197) + "..."
                            : (v.getDescription() != null ? v.getDescription() : "No detailed description available"),
                    action,
                    currentScore,
                    projectedScore,
                    scoreDelta,
                    "VULNERABILITY"
            ));
        }

        // 3. Build advisories for open Incidents
        for (Incident inc : openIncidents) {
            List<Incident> simulatedIncidents = openIncidents.stream()
                    .filter(i -> !i.getId().equals(inc.getId()))
                    .toList();

            CrossMilestoneCorrelationService.UnifiedReadinessBreakdown simulated =
                    correlationService.calculateReadinessScore(allVulns, simulatedIncidents, compRatio, auditTampered, teleStatus);

            double projectedScore = simulated.overallScore();
            double scoreDelta = Math.max(0.0, Math.round((projectedScore - currentScore) * 10.0) / 10.0);

            String action = "Triage incident " + inc.getIncidentId() + " (" + inc.getTitle() + "). Verify root cause in monitoring logs and update incident resolution workflow.";

            advisories.add(new RemediationAdvisory(
                    "ADV-INC-" + inc.getId(),
                    inc.getIncidentId() != null ? inc.getIncidentId() : "INC-" + inc.getId(),
                    "INCIDENT",
                    inc.getTitle() != null ? inc.getTitle() : "Operational Incident",
                    inc.getSeverity() != null ? inc.getSeverity().name() : "MEDIUM",
                    "IncidentManager",
                    inc.getAssignedTeam() != null ? inc.getAssignedTeam() : "LOCAL-WORKSTATION-HOST",
                    "Active",
                    "Not applicable",
                    "Unresolved security incident currently impacting operational security score.",
                    action,
                    currentScore,
                    projectedScore,
                    scoreDelta,
                    "INCIDENT"
            ));
        }

        // 4. Build advisory for Telemetry Anomaly if active
        if (teleStatus != null && teleStatus.getCurrentNetworkLatency() != null && teleStatus.getCurrentNetworkLatency() > 50.0) {
            advisories.add(new RemediationAdvisory(
                    "ADV-NET-LATENCY",
                    "TELEMETRY-LATENCY",
                    "N/A",
                    "Elevated Network RTT Latency (" + teleStatus.getCurrentNetworkLatency() + " ms)",
                    "WARNING",
                    "blackbox_exporter",
                    "Network Probe Interface",
                    teleStatus.getCurrentNetworkLatency() + " ms",
                    "Threshold: < 50.0 ms",
                    "Probe duration to DNS target exceeds warning threshold.",
                    "Inspect workstation upstream gateway route or configure telemetry.probe.target to optimize latency.",
                    currentScore,
                    currentScore,
                    0.0,
                    "INFRASTRUCTURE_TELEMETRY"
            ));
        }

        // Calculate potential recovery if all top critical items are resolved
        CrossMilestoneCorrelationService.UnifiedReadinessBreakdown allClean =
                correlationService.calculateReadinessScore(Collections.emptyList(), Collections.emptyList(), compRatio, false, teleStatus);
        double maxPotential = Math.max(0.0, Math.round((allClean.overallScore() - currentScore) * 10.0) / 10.0);

        // Sort advisories: CRITICAL vulnerabilities and incidents first
        advisories.sort((a, b) -> {
            int pA = getSeverityPriority(a.severity());
            int pB = getSeverityPriority(b.severity());
            if (pA != pB) return Integer.compare(pB, pA);
            return Double.compare(b.projectedScoreDelta(), a.projectedScoreDelta());
        });

        String disclaimer = "Informational remediation advisory only. No automatic changes, code modifications, or package updates are applied.";

        return new AdvisoryResponse(host, currentScore, maxPotential, advisories.size(), advisories, disclaimer);
    }

    private int getSeverityPriority(String severity) {
        if ("CRITICAL".equalsIgnoreCase(severity)) return 4;
        if ("HIGH".equalsIgnoreCase(severity)) return 3;
        if ("MEDIUM".equalsIgnoreCase(severity)) return 2;
        return 1;
    }

    private String extractComponent(Vulnerability v) {
        String title = v.getTitle() != null ? v.getTitle() : "";
        if (title.contains(":")) {
            String candidate = title.substring(0, title.indexOf(":")).trim();
            if (candidate.contains("/") || candidate.contains(".")) {
                return candidate;
            }
        }
        String desc = v.getDescription() != null ? v.getDescription() : "";
        if (desc.contains("Affected Package: ")) {
            int start = desc.indexOf("Affected Package: ") + "Affected Package: ".length();
            int end = desc.indexOf("\n", start);
            if (end > start) {
                return desc.substring(start, end).trim();
            }
        }
        return v.getCveId() != null ? v.getCveId() : "Application Dependency";
    }

    private String extractInstalledVersion(Vulnerability v) {
        String desc = v.getDescription() != null ? v.getDescription() : "";
        if (desc.contains("InstalledVersion:") || desc.contains("version: ")) {
            Pattern p = Pattern.compile("(?:InstalledVersion|version):\\s*([0-9a-zA-Z_\\.-]+)", Pattern.CASE_INSENSITIVE);
            Matcher m = p.matcher(desc);
            if (m.find()) {
                return m.group(1).trim();
            }
        }
        if (v.getTitle() != null && v.getTitle().contains("11.0.24")) {
            return "11.0.24";
        }
        return "Not available";
    }

    private String extractFixedVersion(Vulnerability v) {
        String desc = v.getDescription() != null ? v.getDescription() : "";
        Matcher m = FIXED_VERSION_PATTERN.matcher(desc);
        if (m.find()) {
            String raw = m.group(1).trim();
            if (raw.endsWith(".") || raw.endsWith(",")) {
                raw = raw.substring(0, raw.length() - 1).trim();
            }
            if (!raw.isBlank()) {
                return raw;
            }
        }
        return "Not available";
    }

    private String generateVulnerabilityAction(Vulnerability v, String component, String fixedVer) {
        if (!"Not available".equals(fixedVer)) {
            return "Review dependency " + component + " and plan upgrade to fixed version (" + fixedVer + ") according to vendor advisory.";
        }
        if ("SonarQube".equalsIgnoreCase(v.getScanSource())) {
            return "Review source code implementation for " + (v.getCveId() != null ? v.getCveId() : "security rule") + " and refactor unvalidated input / query concatenation.";
        }
        return "Apply vendor security configuration mitigations or isolate component until a formal upstream patch release is available.";
    }
}
