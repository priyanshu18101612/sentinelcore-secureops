package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class DevSecOpsDashboardService {

    private final VulnerabilityRepository vulnerabilityRepository;
    private final IncidentRepository incidentRepository;
    private final ComplianceFrameworkService complianceFrameworkService;

    public record ScannerMetrics(
            String scannerName,
            long totalFindings,
            long critical,
            long high,
            long medium,
            long low,
            String status,
            String lastScanSummary
    ) {}

    public record DevSecOpsPosture(
            long totalVulnerabilities,
            long criticalVulnerabilities,
            long highVulnerabilities,
            long mediumVulnerabilities,
            long lowVulnerabilities,
            double fleetRiskScore,
            long totalAffectedAssets,
            long totalPatchedAssets,
            long totalPendingAssets,
            double patchComplianceRate,
            long openIncidents,
            long criticalOrHighIncidents,
            ScannerMetrics trivyScanner,
            ScannerMetrics sonarQubeScanner,
            String complianceOverallStatus,
            double complianceScore,
            int compliancePassedControls,
            int complianceFailedControls
    ) {}

    public DevSecOpsDashboardService(
            VulnerabilityRepository vulnerabilityRepository,
            IncidentRepository incidentRepository,
            ComplianceFrameworkService complianceFrameworkService
    ) {
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.incidentRepository = incidentRepository;
        this.complianceFrameworkService = complianceFrameworkService;
    }

    public DevSecOpsPosture getPosture() {
        List<Vulnerability> allVulns = vulnerabilityRepository.findAll();
        List<Incident> allIncidents = incidentRepository.findAll();
        ComplianceFrameworkService.OverallComplianceSummary comp = complianceFrameworkService.getFrameworksSummary();

        long total = allVulns.size();
        long crit = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.CRITICAL).count();
        long high = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.HIGH).count();
        long med = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.MEDIUM).count();
        long low = allVulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.LOW).count();

        double avgRisk = allVulns.isEmpty() ? 0.0 :
                Math.round(allVulns.stream().mapToDouble(v -> v.getRiskScore() != null ? v.getRiskScore() : 0.0).average().orElse(0.0) * 10.0) / 10.0;

        long affected = allVulns.stream().mapToLong(v -> v.getAffectedAssets() != null ? v.getAffectedAssets() : 0).sum();
        long patched = allVulns.stream().mapToLong(v -> v.getPatchedAssets() != null ? v.getPatchedAssets() : 0).sum();
        long pending = allVulns.stream().mapToLong(v -> v.getPendingAssets() != null ? v.getPendingAssets() : 0).sum();

        double patchRate = affected > 0 ? Math.round((patched * 100.0 / affected) * 10.0) / 10.0 : 100.0;

        // Incident metrics
        long openInc = allIncidents.stream()
                .filter(i -> i.getStatus() != null && !"RESOLVED".equalsIgnoreCase(i.getStatus().name()) && !"CLOSED".equalsIgnoreCase(i.getStatus().name()))
                .count();

        long critOrHighInc = allIncidents.stream()
                .filter(i -> i.getStatus() != null && !"RESOLVED".equalsIgnoreCase(i.getStatus().name()) && !"CLOSED".equalsIgnoreCase(i.getStatus().name()))
                .filter(i -> i.getSeverity() != null && ("CRITICAL".equalsIgnoreCase(i.getSeverity().name()) || "HIGH".equalsIgnoreCase(i.getSeverity().name())))
                .count();

        // Scanner metrics
        List<Vulnerability> trivyVulns = allVulns.stream()
                .filter(v -> v.getScanSource() != null && v.getScanSource().toUpperCase().contains("TRIVY"))
                .toList();

        List<Vulnerability> sonarVulns = allVulns.stream()
                .filter(v -> v.getScanSource() != null && v.getScanSource().toUpperCase().contains("SONAR"))
                .toList();

        ScannerMetrics trivyMetrics = buildScannerMetrics("Trivy Container & SCA", trivyVulns);
        ScannerMetrics sonarMetrics = buildScannerMetrics("SonarQube SAST", sonarVulns);

        return new DevSecOpsPosture(
                total,
                crit,
                high,
                med,
                low,
                avgRisk,
                affected,
                patched,
                pending,
                patchRate,
                openInc,
                critOrHighInc,
                trivyMetrics,
                sonarMetrics,
                comp.overallStatus(),
                comp.overallScore(),
                comp.passedControls(),
                comp.failedControls()
        );
    }

    private ScannerMetrics buildScannerMetrics(String name, List<Vulnerability> vulns) {
        long count = vulns.size();
        long c = vulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.CRITICAL).count();
        long h = vulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.HIGH).count();
        long m = vulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.MEDIUM).count();
        long l = vulns.stream().filter(v -> v.getSeverity() == VulnerabilitySeverity.LOW).count();

        String status = count > 0 ? (c > 0 ? "ACTION_REQUIRED" : "OPERATIONAL") : "STANDBY";
        String summary = count > 0
                ? count + " findings registered (" + c + " critical, " + h + " high)"
                : "No scan findings imported yet. Scanner ready.";

        return new ScannerMetrics(name, count, c, h, m, l, status, summary);
    }
}
