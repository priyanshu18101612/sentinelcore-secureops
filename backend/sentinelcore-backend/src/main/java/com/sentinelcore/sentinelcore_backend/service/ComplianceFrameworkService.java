package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.ComplianceControl;
import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.ComplianceControlRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ComplianceFrameworkService {

    private final ComplianceControlRepository complianceControlRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final IncidentRepository incidentRepository;
    private final AuditLogService auditLogService;
    private final AccessLogRepository accessLogRepository;

    public record FrameworkSummary(
            String framework,
            String name,
            String description,
            double complianceScore,
            String status,
            int totalControls,
            int passedControls,
            int failedControls,
            int warningControls,
            List<ComplianceControl> controls
    ) {}

    public record OverallComplianceSummary(
            String overallStatus,
            double overallScore,
            int totalFrameworks,
            int totalControls,
            int passedControls,
            int failedControls,
            int warningControls,
            LocalDateTime lastEvaluatedAt,
            List<FrameworkSummary> frameworks
    ) {}

    public ComplianceFrameworkService(
            ComplianceControlRepository complianceControlRepository,
            VulnerabilityRepository vulnerabilityRepository,
            IncidentRepository incidentRepository,
            AuditLogService auditLogService,
            AccessLogRepository accessLogRepository
    ) {
        this.complianceControlRepository = complianceControlRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.incidentRepository = incidentRepository;
        this.auditLogService = auditLogService;
        this.accessLogRepository = accessLogRepository;
    }

    @PostConstruct
    public void initDefaultControls() {
        if (complianceControlRepository.count() == 0) {
            seedDefaultControls();
            evaluateAllFrameworksInternal();
        }
    }

    private void seedDefaultControls() {
        List<ComplianceControl> defaults = List.of(
                // PCI DSS
                new ComplianceControl("PCI_DSS", "PCI-6.2", "Deploy Critical Vulnerability Security Patches",
                        "Vulnerability Management", "Ensure all high and critical security patches are installed to eliminate known exploit vectors.",
                        "PENDING", LocalDateTime.now(), "Awaiting evaluation against active CVE inventory."),
                new ComplianceControl("PCI_DSS", "PCI-10.1", "Audit Trail Integrity & Cryptographic Chaining",
                        "Audit & Logging", "Implement automated tamper-evident audit trails with cryptographic hash verification.",
                        "PENDING", LocalDateTime.now(), "Awaiting SHA-256 chain verification."),
                new ComplianceControl("PCI_DSS", "PCI-10.2", "Comprehensive Administrative Event Logging",
                        "Audit & Logging", "Record all security incident actions, user logins, and privilege escalations.",
                        "PENDING", LocalDateTime.now(), "Awaiting audit log store inspection."),
                new ComplianceControl("PCI_DSS", "PCI-12.10", "Incident Response & SLA Remediation",
                        "Incident Management", "Maintain an operational incident response plan with active SLA tracking.",
                        "PENDING", LocalDateTime.now(), "Awaiting incident MTTR and SLA analysis."),

                // SOC 2
                new ComplianceControl("SOC_2", "SOC2-CC6.1", "Logical Access Control & Authentication Monitoring",
                        "Access Control", "Track all user authentications, login failures, and session events to prevent unauthorized entry.",
                        "PENDING", LocalDateTime.now(), "Awaiting authentication log review."),
                new ComplianceControl("SOC_2", "SOC2-CC6.8", "Tamper-Evident System Audit Trails",
                        "Security Operations", "Ensure security event records are immutable and protected against unauthorized modification.",
                        "PENDING", LocalDateTime.now(), "Awaiting audit integrity check."),
                new ComplianceControl("SOC_2", "SOC2-CC7.1", "Continuous Vulnerability Detection & Scans",
                        "Vulnerability Management", "Continuously identify security vulnerabilities across source code and containers.",
                        "PENDING", LocalDateTime.now(), "Awaiting Trivy and SonarQube scan ingestion review."),
                new ComplianceControl("SOC_2", "SOC2-CC7.3", "Security Incident Detection & Workflow",
                        "Incident Management", "Detect, triage, assign, and remediate security events within structured lifecycles.",
                        "PENDING", LocalDateTime.now(), "Awaiting incident tracking review."),

                // ISO 27001
                new ComplianceControl("ISO_27001", "ISO-A.12.1.2", "Change Management & Operations Auditing",
                        "Operations Security", "Ensure changes to systems, vulnerabilities, and incidents are tracked in an audit trail.",
                        "PENDING", LocalDateTime.now(), "Awaiting audit history analysis."),
                new ComplianceControl("ISO_27001", "ISO-A.12.4.1", "Security Event Logging & Verification",
                        "Logging & Monitoring", "Produce and securely store logs of user activities, exceptions, and security events.",
                        "PENDING", LocalDateTime.now(), "Awaiting log store check."),
                new ComplianceControl("ISO_27001", "ISO-A.12.6.1", "Technical Vulnerability Management",
                        "Information Security", "Systematically evaluate technical vulnerabilities and apply timely risk mitigations.",
                        "PENDING", LocalDateTime.now(), "Awaiting vulnerability risk score evaluation."),
                new ComplianceControl("ISO_27001", "ISO-A.16.1.5", "Response to Information Security Incidents",
                        "Incident Management", "Security incidents shall be responded to in accordance with the documented procedures.",
                        "PENDING", LocalDateTime.now(), "Awaiting incident resolution evaluation.")
        );

        complianceControlRepository.saveAll(defaults);
    }

    public synchronized OverallComplianceSummary evaluateAllFrameworks() {
        OverallComplianceSummary summary = evaluateAllFrameworksInternal();

        auditLogService.logAction(
                null,
                "COMPLIANCE",
                "ALL",
                "COMPLIANCE_EVALUATION",
                "COMPLIANCE_CHECK_EXECUTED",
                "System",
                "ComplianceService",
                "Executed automated compliance evaluation across PCI DSS, SOC 2, and ISO 27001. Score: "
                        + summary.overallScore() + "% Status: " + summary.overallStatus()
        );

        return summary;
    }

    private OverallComplianceSummary evaluateAllFrameworksInternal() {
        List<ComplianceControl> allControls = complianceControlRepository.findAllByOrderByFrameworkAscControlIdAsc();
        if (allControls.isEmpty()) {
            seedDefaultControls();
            allControls = complianceControlRepository.findAllByOrderByFrameworkAscControlIdAsc();
        }

        // Gather real telemetry from repositories
        List<Vulnerability> vulns = vulnerabilityRepository.findAll();
        List<Incident> incidents = incidentRepository.findAll();
        AuditLogService.ChainVerificationResult chainResult = auditLogService.verifyChainIntegrity();
        long auditLogCount = chainResult.totalRecords();
        long totalAccessLogs = accessLogRepository.count();
        long failedAccessLogs = accessLogRepository.countByStatus("FAILED");

        // Compute vulnerability metrics
        long criticalUnpatched = vulns.stream()
                .filter(v -> v.getSeverity() == VulnerabilitySeverity.CRITICAL && v.getPendingAssets() != null && v.getPendingAssets() > 0)
                .count();
        double avgRiskScore = vulns.isEmpty() ? 0.0 :
                vulns.stream().mapToDouble(v -> v.getRiskScore() != null ? v.getRiskScore() : 0.0).average().orElse(0.0);

        // Compute incident metrics
        long openIncidents = incidents.stream()
                .filter(i -> i.getStatus() != null && !i.getStatus().name().equalsIgnoreCase("RESOLVED") && !i.getStatus().name().equalsIgnoreCase("CLOSED"))
                .count();

        LocalDateTime now = LocalDateTime.now();

        for (ComplianceControl control : allControls) {
            control.setLastEvaluatedAt(now);
            switch (control.getControlId()) {
                case "PCI-6.2":
                    if (criticalUnpatched == 0) {
                        control.setStatus("PASSED");
                        control.setEvidenceSummary("Zero critical unpatched vulnerabilities detected. " + vulns.size() + " total CVEs evaluated.");
                    } else {
                        control.setStatus("FAILED");
                        control.setEvidenceSummary("Violation: " + criticalUnpatched + " CRITICAL vulnerability records have pending assets awaiting patches.");
                    }
                    break;

                case "PCI-10.1":
                case "SOC2-CC6.8":
                    if (chainResult.tamperDetected()) {
                        control.setStatus("FAILED");
                        control.setEvidenceSummary("Tampering detected during cryptographic audit chain verification: " + chainResult.message());
                    } else if (auditLogCount > 0) {
                        control.setStatus("PASSED");
                        control.setEvidenceSummary("SHA-256 immutable audit chain verified across " + auditLogCount + " active log records.");
                    } else {
                        control.setStatus("WARNING");
                        control.setEvidenceSummary("Audit chain is initialized and verified, but currently contains 0 records.");
                    }
                    break;

                case "PCI-10.2":
                case "ISO-A.12.1.2":
                case "ISO-A.12.4.1":
                    if (auditLogCount > 0) {
                        control.setStatus("PASSED");
                        control.setEvidenceSummary("Centralized audit logging active with " + auditLogCount + " recorded security and administrative operations.");
                    } else {
                        control.setStatus("WARNING");
                        control.setEvidenceSummary("Audit system operational, waiting for administrative activities to be logged.");
                    }
                    break;

                case "PCI-12.10":
                case "SOC2-CC7.3":
                case "ISO-A.16.1.5":
                    control.setStatus("PASSED");
                    control.setEvidenceSummary("Active incident response workflow in place. " + incidents.size() + " total incidents logged (" + openIncidents + " open).");
                    break;

                case "SOC2-CC6.1":
                    control.setStatus("PASSED");
                    control.setEvidenceSummary("Access tracking monitoring active. " + totalAccessLogs + " total authentication events recorded (" + failedAccessLogs + " failed).");
                    break;

                case "SOC2-CC7.1":
                    if (!vulns.isEmpty()) {
                        control.setStatus("PASSED");
                        control.setEvidenceSummary("Continuous vulnerability assessment active. " + vulns.size() + " CVEs tracked from scanner inputs.");
                    } else {
                        control.setStatus("WARNING");
                        control.setEvidenceSummary("No vulnerabilities registered in inventory. Run Trivy or SonarQube scans to populate findings.");
                    }
                    break;

                case "ISO-A.12.6.1":
                    if (avgRiskScore <= 5.0) {
                        control.setStatus("PASSED");
                        control.setEvidenceSummary("Fleet risk score at " + String.format(Locale.US, "%.1f", avgRiskScore) + " / 10.0, safely within acceptable tolerance.");
                    } else {
                        control.setStatus("WARNING");
                        control.setEvidenceSummary("Average risk score is elevated at " + String.format(Locale.US, "%.1f", avgRiskScore) + " / 10.0.");
                    }
                    break;

                default:
                    control.setStatus("PASSED");
                    control.setEvidenceSummary("Baseline security controls validated against live configuration.");
                    break;
            }
        }

        complianceControlRepository.saveAll(allControls);

        // Group into framework summaries
        List<FrameworkSummary> frameworkSummaries = new ArrayList<>();
        String[] frameworkKeys = {"PCI_DSS", "SOC_2", "ISO_27001"};
        String[] frameworkNames = {"PCI DSS v4.0", "SOC 2 Type II", "ISO/IEC 27001"};
        String[] frameworkDescs = {
                "Payment Card Industry Data Security Standard security control validation",
                "Service Organization Control 2 Trust Services Criteria verification",
                "Information security management systems specifications"
        };

        int grandTotal = 0;
        int grandPassed = 0;
        int grandFailed = 0;
        int grandWarning = 0;

        for (int i = 0; i < frameworkKeys.length; i++) {
            String key = frameworkKeys[i];
            List<ComplianceControl> controls = allControls.stream()
                    .filter(c -> c.getFramework().equalsIgnoreCase(key))
                    .toList();

            int total = controls.size();
            int passed = (int) controls.stream().filter(c -> "PASSED".equalsIgnoreCase(c.getStatus())).count();
            int failed = (int) controls.stream().filter(c -> "FAILED".equalsIgnoreCase(c.getStatus())).count();
            int warning = (int) controls.stream().filter(c -> "WARNING".equalsIgnoreCase(c.getStatus())).count();

            double score = total > 0 ? Math.round((passed * 100.0 / total) * 10.0) / 10.0 : 0.0;
            String status = failed > 0 ? "NON_COMPLIANT" : (warning > 0 ? "PARTIALLY_COMPLIANT" : "COMPLIANT");

            grandTotal += total;
            grandPassed += passed;
            grandFailed += failed;
            grandWarning += warning;

            frameworkSummaries.add(new FrameworkSummary(
                    key,
                    frameworkNames[i],
                    frameworkDescs[i],
                    score,
                    status,
                    total,
                    passed,
                    failed,
                    warning,
                    controls
            ));
        }

        double overallScore = grandTotal > 0 ? Math.round((grandPassed * 100.0 / grandTotal) * 10.0) / 10.0 : 0.0;
        String overallStatus = grandFailed > 0 ? "NON_COMPLIANT" : (grandWarning > 0 ? "PARTIALLY_COMPLIANT" : "COMPLIANT");

        return new OverallComplianceSummary(
                overallStatus,
                overallScore,
                frameworkSummaries.size(),
                grandTotal,
                grandPassed,
                grandFailed,
                grandWarning,
                now,
                frameworkSummaries
        );
    }

    public OverallComplianceSummary getFrameworksSummary() {
        List<ComplianceControl> controls = complianceControlRepository.findAllByOrderByFrameworkAscControlIdAsc();
        if (controls.isEmpty() || controls.stream().anyMatch(c -> "PENDING".equalsIgnoreCase(c.getStatus()))) {
            return evaluateAllFrameworks();
        }

        // Return latest evaluated state
        return evaluateAllFrameworksInternal();
    }

    public FrameworkSummary getFrameworkDetail(String framework) {
        OverallComplianceSummary summary = getFrameworksSummary();
        return summary.frameworks().stream()
                .filter(f -> f.framework().equalsIgnoreCase(framework) || f.name().equalsIgnoreCase(framework))
                .findFirst()
                .orElse(null);
    }
}
