package com.sentinelcore.sentinelcore_backend.service;

import tools.jackson.databind.ObjectMapper;
import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.SecurityReport;
import com.sentinelcore.sentinelcore_backend.model.SecurityReview;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.AuditLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.SecurityReportRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportGenerationService {

    private static final Logger log = LoggerFactory.getLogger(ReportGenerationService.class);

    private final SecurityReportRepository securityReportRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final IncidentRepository incidentRepository;
    private final AccessLogRepository accessLogRepository;
    private final AuditLogRepository auditLogRepository;
    private final AuditLogService auditLogService;
    private final ComplianceFrameworkService complianceFrameworkService;
    private final SecurityReviewService securityReviewService;
    private final CrossMilestoneCorrelationService correlationService;
    private final ObjectMapper objectMapper;

    public ReportGenerationService(
            SecurityReportRepository securityReportRepository,
            VulnerabilityRepository vulnerabilityRepository,
            IncidentRepository incidentRepository,
            AccessLogRepository accessLogRepository,
            AuditLogRepository auditLogRepository,
            AuditLogService auditLogService,
            ComplianceFrameworkService complianceFrameworkService,
            SecurityReviewService securityReviewService,
            CrossMilestoneCorrelationService correlationService
    ) {
        this.securityReportRepository = securityReportRepository;
        this.vulnerabilityRepository = vulnerabilityRepository;
        this.incidentRepository = incidentRepository;
        this.accessLogRepository = accessLogRepository;
        this.auditLogRepository = auditLogRepository;
        this.auditLogService = auditLogService;
        this.complianceFrameworkService = complianceFrameworkService;
        this.securityReviewService = securityReviewService;
        this.correlationService = correlationService;
        this.objectMapper = new ObjectMapper();
    }

    public List<SecurityReport> getAllReports() {
        return securityReportRepository.findAllByOrderByGeneratedAtDesc();
    }

    public Optional<SecurityReport> getReportById(Long id) {
        return securityReportRepository.findById(id);
    }

    public record AttestationVerificationResult(
            Long reportId,
            String reportType,
            String status, // "INTEGRITY_VERIFIED" or "TAMPER_DETECTED" or "NOT_APPLICABLE" or "NOT_FOUND"
            boolean isTampered,
            String storedDigest,
            String recalculatedDigest,
            boolean auditLogChainBacked,
            Long auditLogId,
            String auditLogHash,
            String verifiedAt,
            String message
    ) {}

    public synchronized SecurityReport generateReport(String type, String generatedBy) {
        String reportType = type != null ? type.toUpperCase() : "SECURITY_REPORT";
        String author = generatedBy != null && !generatedBy.isBlank() ? generatedBy : "Lead SecOps Engineer";
        LocalDateTime now = LocalDateTime.now();

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("reportType", reportType);
        payload.put("generatedAt", now.toString());
        payload.put("generatedBy", author);

        // Fetch real data
        AuditLogService.AuditStats auditStats = auditLogService.getAuditStats();
        List<Vulnerability> vulns = vulnerabilityRepository.findAll();
        List<Incident> incidents = incidentRepository.findAll();
        ComplianceFrameworkService.OverallComplianceSummary compliance = complianceFrameworkService.getFrameworksSummary();
        SecurityReview review = securityReviewService.getCurrentReview();

        long totalAccess = accessLogRepository.count();
        long failedAccess = accessLogRepository.countByStatus("FAILED");
        long successAccess = accessLogRepository.countByEventType("LOGIN_SUCCESS");

        String title;
        switch (reportType) {
            case "DEVSECOPS_EXECUTIVE_ATTESTATION":
                title = "Executive DevSecOps Audit Attestation & System Health Brief";
                // 1. Single atomic correlation snapshot
                CrossMilestoneCorrelationService.HostCorrelationResponse snapshot = correlationService.getHostCorrelation();

                Map<String, Object> attestationMap = new TreeMap<>();
                attestationMap.put("reportType", reportType);
                attestationMap.put("title", title);
                attestationMap.put("generatedAt", now.toString());
                attestationMap.put("generatedBy", author);
                attestationMap.put("monitoredHost", snapshot.hostName());
                attestationMap.put("hostOperationalStatus", snapshot.hostOperationalStatus());

                // Readiness breakdown
                Map<String, Object> readinessMap = new TreeMap<>();
                if (snapshot.readinessScore() != null) {
                    readinessMap.put("overallScore", snapshot.readinessScore().overallScore());
                    readinessMap.put("securityScore", snapshot.readinessScore().securityScore());
                    readinessMap.put("complianceScore", snapshot.readinessScore().complianceScore());
                    readinessMap.put("infrastructureScore", snapshot.readinessScore().infrastructureScore());
                    readinessMap.put("calculationNote", snapshot.readinessScore().calculationNote());
                }
                attestationMap.put("readinessScore", readinessMap);

                // Telemetry snapshot (strictly non-sensitive operational metrics)
                Map<String, Object> teleMap = new TreeMap<>();
                if (snapshot.liveTelemetry() != null) {
                    teleMap.put("cpuUsagePercent", snapshot.liveTelemetry().get("cpuUsagePercent"));
                    teleMap.put("memoryUsagePercent", snapshot.liveTelemetry().get("memoryUsagePercent"));
                    teleMap.put("diskUsagePercent", snapshot.liveTelemetry().get("diskUsagePercent"));
                    teleMap.put("networkLatencyMs", snapshot.liveTelemetry().get("networkLatencyMs"));
                    teleMap.put("telemetrySource", snapshot.liveTelemetry().get("telemetrySource"));
                    teleMap.put("prometheusConnected", snapshot.liveTelemetry().get("prometheusConnected"));
                    teleMap.put("blackboxExporterConnected", snapshot.liveTelemetry().get("blackboxExporterConnected"));
                }
                attestationMap.put("telemetrySnapshot", teleMap);

                // Incidents summary
                Map<String, Object> incSummary = new TreeMap<>();
                incSummary.put("openIncidentsCount", snapshot.activeIncidents() != null ? snapshot.activeIncidents().size() : 0);
                incSummary.put("incidents", sanitizeIncidents(snapshot.activeIncidents()));
                attestationMap.put("activeIncidentsSummary", incSummary);

                // Vulnerabilities summary
                Map<String, Object> vulnSummary = new TreeMap<>();
                vulnSummary.put("totalFindingsCount", snapshot.activeVulnerabilities() != null ? snapshot.activeVulnerabilities().size() : 0);
                vulnSummary.put("breakdown", calculateVulnerabilityBreakdown(vulns));
                vulnSummary.put("findings", sanitizeVulnerabilities(snapshot.activeVulnerabilities()));
                attestationMap.put("vulnerabilitySummary", vulnSummary);

                // Compliance summary with framework readiness evidence statements
                Map<String, Object> compMap = new TreeMap<>();
                compMap.put("overallStatus", compliance.overallStatus());
                compMap.put("overallScore", compliance.overallScore());
                compMap.put("passedControls", compliance.passedControls());
                compMap.put("failedControls", compliance.failedControls());
                compMap.put("totalControls", compliance.totalControls());

                List<String> frameworkStatements = List.of(
                        "PCI DSS v4.0: Readiness evidence evaluated against payment card security control baseline; reflects internal operational posture, not formal QSA certification.",
                        "SOC 2 Type II: Trust Services Criteria operational evidence evaluated; reflects security control alignment, not independent CPA audit certification.",
                        "ISO/IEC 27001: Information security management controls evaluated; reflects organizational security alignment, not accredited registrar certification."
                );
                compMap.put("frameworkReadinessStatements", frameworkStatements);
                attestationMap.put("complianceSummary", compMap);

                // Audit chain summary
                Map<String, Object> auditSummary = new TreeMap<>();
                auditSummary.put("totalAuditRecords", auditStats.totalLogs());
                auditSummary.put("auditChainStatus", auditStats.integrityStatus());
                String latestAuditHash = auditLogRepository.findFirstByOrderByIdDesc()
                        .map(AuditLog::getHash)
                        .orElse("0000000000000000000000000000000000000000000000000000000000000000");
                auditSummary.put("latestAuditBlockHash", latestAuditHash);
                attestationMap.put("auditChainSummary", auditSummary);

                // Tamper-evident integrity notice
                attestationMap.put("tamperEvidentIntegrityNotice",
                        "This SHA-256 digest provides tamper-evident cryptographic checksum integrity over this canonical payload. It is not an asymmetric PKI digital signature.");

                // Canonical deterministic serialization & SHA-256 digest
                String canonicalJson = serializeToCanonicalJson(attestationMap);
                String digest = sha256Hex(canonicalJson);

                // Embed digest in saved payload
                attestationMap.put("tamperEvidentIntegrityDigest", digest);
                payload = attestationMap;
                break;

            case "ACCESS_REPORT":
                title = "Authentication & Access Governance Audit Report";
                payload.put("totalAccessEvents", totalAccess);
                payload.put("successfulLogins", successAccess);
                payload.put("failedLogins", failedAccess);
                payload.put("recentLogs", accessLogRepository.findAllByOrderByTimestampDesc().stream().limit(10).toList());
                break;

            case "COMPLIANCE_REPORT":
                title = "Multi-Framework Regulatory Compliance Report";
                payload.put("overallComplianceScore", compliance.overallScore());
                payload.put("overallStatus", compliance.overallStatus());
                payload.put("totalFrameworks", compliance.totalFrameworks());
                payload.put("frameworks", compliance.frameworks());
                break;

            case "DEVSECOPS_REPORT":
                title = "Unified DevSecOps Security Posture Report";
                payload.put("totalVulnerabilities", vulns.size());
                payload.put("vulnerabilityBreakdown", calculateVulnerabilityBreakdown(vulns));
                payload.put("incidentStatus", calculateIncidentBreakdown(incidents));
                payload.put("auditIntegrity", auditStats.integrityStatus());
                payload.put("complianceScore", compliance.overallScore());
                break;

            case "SECURITY_REPORT":
            default:
                title = "Executive Security Operations & Risk Summary Report";
                payload.put("auditTotalLogs", auditStats.totalLogs());
                payload.put("auditIntegrity", auditStats.integrityStatus());
                payload.put("vulnerabilitiesTotal", vulns.size());
                payload.put("vulnerabilitiesBreakdown", calculateVulnerabilityBreakdown(vulns));
                payload.put("incidentsTotal", incidents.size());
                payload.put("incidentsBreakdown", calculateIncidentBreakdown(incidents));
                payload.put("complianceStatus", compliance.overallStatus());
                payload.put("complianceScore", compliance.overallScore());
                payload.put("reviewStatus", review.getStatus());
                payload.put("reviewAnomalies", review.getAnomaliesDetected());
                break;
        }

        String jsonSummary;
        try {
            jsonSummary = objectMapper.writeValueAsString(payload);
        } catch (Exception e) {
            jsonSummary = "{\"error\": \"Serialization failed\", \"message\": \"" + e.getMessage() + "\"}";
        }

        SecurityReport report = new SecurityReport(
                reportType,
                title,
                author,
                now,
                jsonSummary,
                "READY"
        );

        SecurityReport saved = securityReportRepository.save(report);

        String auditAction = "DEVSECOPS_EXECUTIVE_ATTESTATION".equalsIgnoreCase(reportType)
                ? "AUDIT_ATTESTATION_GENERATED"
                : "REPORT_GENERATED";

        auditLogService.logAction(
                null,
                "REPORT",
                String.valueOf(saved.getId()),
                "GOVERNANCE_REPORTING",
                auditAction,
                author,
                "ReportGenerationService",
                "Generated " + reportType + " titled '" + title + "' (Report ID #" + saved.getId() + ")"
        );

        return saved;
    }

    public synchronized AttestationVerificationResult verifyAttestation(Long reportId) {
        Optional<SecurityReport> opt = securityReportRepository.findById(reportId);
        if (opt.isEmpty()) {
            return new AttestationVerificationResult(
                    reportId, null, "NOT_FOUND", true, null, null, false, null, null,
                    LocalDateTime.now().toString(), "Report #" + reportId + " not found in database."
            );
        }

        SecurityReport report = opt.get();
        if (!"DEVSECOPS_EXECUTIVE_ATTESTATION".equalsIgnoreCase(report.getReportType())) {
            return new AttestationVerificationResult(
                    reportId, report.getReportType(), "NOT_APPLICABLE", false, null, null, false, null, null,
                    LocalDateTime.now().toString(), "Report #" + reportId + " is not an attestation report."
            );
        }

        try {
            // Read stored historical canonical payload directly from PostgreSQL
            String storedJson = report.getSummaryData();
            @SuppressWarnings("unchecked")
            Map<String, Object> map = objectMapper.readValue(storedJson, Map.class);
            String storedDigest = (String) map.get("tamperEvidentIntegrityDigest");

            // Reconstruct canonical payload without the digest field
            Map<String, Object> payloadWithoutDigest = new TreeMap<>();
            for (Map.Entry<String, Object> entry : map.entrySet()) {
                if (!"tamperEvidentIntegrityDigest".equals(entry.getKey())) {
                    payloadWithoutDigest.put(entry.getKey(), entry.getValue());
                }
            }

            String canonicalReconstructed = serializeToCanonicalJson(payloadWithoutDigest);
            String recalculatedDigest = sha256Hex(canonicalReconstructed);

            boolean digestMatches = storedDigest != null && storedDigest.equalsIgnoreCase(recalculatedDigest);

            // Verify matching audit log event in PostgreSQL audit_logs
            List<AuditLog> matchingLogs = auditLogRepository.findByEntityTypeOrderByTimestampDesc("REPORT").stream()
                    .filter(l -> String.valueOf(reportId).equals(l.getEntityId()))
                    .toList();
            boolean auditBacked = matchingLogs.stream().anyMatch(l -> "AUDIT_ATTESTATION_GENERATED".equals(l.getAction()));
            Long auditLogId = matchingLogs.stream()
                    .filter(l -> "AUDIT_ATTESTATION_GENERATED".equals(l.getAction()))
                    .map(AuditLog::getId)
                    .findFirst()
                    .orElse(null);
            String auditHash = matchingLogs.stream()
                    .filter(l -> "AUDIT_ATTESTATION_GENERATED".equals(l.getAction()))
                    .map(AuditLog::getHash)
                    .findFirst()
                    .orElse(null);

            boolean clean = digestMatches && auditBacked;
            String status = clean ? "INTEGRITY_VERIFIED" : "TAMPER_DETECTED";
            String msg = clean
                    ? "Tamper-evident cryptographic integrity verified. Stored historical payload matches original SHA-256 digest and immutable audit log chain."
                    : (!digestMatches
                    ? "Tamper detected: Stored database payload has been modified. Recalculated SHA-256 digest does not match stored digest."
                    : "Tamper detected: Matching immutable audit log event missing from audit log chain.");

            return new AttestationVerificationResult(
                    reportId, report.getReportType(), status, !clean, storedDigest, recalculatedDigest,
                    auditBacked, auditLogId, auditHash, LocalDateTime.now().toString(), msg
            );
        } catch (Exception e) {
            log.error("Attestation verification error for report #{}: {}", reportId, e.getMessage());
            return new AttestationVerificationResult(
                    reportId, report.getReportType(), "TAMPER_DETECTED", true, null, null, false, null, null,
                    LocalDateTime.now().toString(), "Verification failed: " + e.getMessage()
            );
        }
    }

    private String serializeToCanonicalJson(Map<String, Object> map) {
        try {
            Map<String, Object> sortedMap = toCanonicalSortedMap(map);
            return objectMapper.writeValueAsString(sortedMap);
        } catch (Exception e) {
            throw new RuntimeException("Canonical serialization failed", e);
        }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toCanonicalSortedMap(Map<String, Object> map) {
        Map<String, Object> sorted = new TreeMap<>();
        for (Map.Entry<String, Object> entry : map.entrySet()) {
            Object value = entry.getValue();
            if (value instanceof Map) {
                sorted.put(entry.getKey(), toCanonicalSortedMap((Map<String, Object>) value));
            } else if (value instanceof List) {
                sorted.put(entry.getKey(), canonicalizeList((List<?>) value));
            } else {
                sorted.put(entry.getKey(), value);
            }
        }
        return sorted;
    }

    @SuppressWarnings("unchecked")
    private List<?> canonicalizeList(List<?> list) {
        List<Object> canonicalList = new ArrayList<>();
        for (Object item : list) {
            if (item instanceof Map) {
                canonicalList.add(toCanonicalSortedMap((Map<String, Object>) item));
            } else if (item instanceof List) {
                canonicalList.add(canonicalizeList((List<?>) item));
            } else {
                canonicalList.add(item);
            }
        }
        return canonicalList;
    }

    public static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception e) {
            throw new RuntimeException("SHA-256 calculation failed", e);
        }
    }

    private List<Map<String, Object>> sanitizeIncidents(List<Map<String, Object>> incidents) {
        if (incidents == null) return Collections.emptyList();
        List<Map<String, Object>> sanitized = new ArrayList<>();
        for (Map<String, Object> inc : incidents) {
            Map<String, Object> item = new TreeMap<>();
            item.put("id", inc.get("id"));
            item.put("incidentId", inc.get("incidentId"));
            item.put("title", inc.get("title"));
            item.put("severity", inc.get("severity"));
            item.put("status", inc.get("status"));
            item.put("assignedTeam", inc.get("assignedTeam"));
            sanitized.add(item);
        }
        return sanitized;
    }

    private List<Map<String, Object>> sanitizeVulnerabilities(List<Map<String, Object>> vulns) {
        if (vulns == null) return Collections.emptyList();
        List<Map<String, Object>> sanitized = new ArrayList<>();
        for (Map<String, Object> v : vulns) {
            Map<String, Object> item = new TreeMap<>();
            item.put("id", v.get("id"));
            item.put("vulnerabilityId", v.get("vulnerabilityId"));
            item.put("cveId", v.get("cveId"));
            item.put("title", v.get("title"));
            item.put("severity", v.get("severity"));
            item.put("cvssScore", v.get("cvssScore"));
            item.put("scanSource", v.get("scanSource"));
            sanitized.add(item);
        }
        return sanitized;
    }

    private Map<String, Object> calculateVulnerabilityBreakdown(List<Vulnerability> vulns) {
        Map<String, Object> map = new TreeMap<>();
        long critical = vulns.stream().filter(v -> "CRITICAL".equalsIgnoreCase(String.valueOf(v.getSeverity()))).count();
        long high = vulns.stream().filter(v -> "HIGH".equalsIgnoreCase(String.valueOf(v.getSeverity()))).count();
        long medium = vulns.stream().filter(v -> "MEDIUM".equalsIgnoreCase(String.valueOf(v.getSeverity()))).count();
        long low = vulns.stream().filter(v -> "LOW".equalsIgnoreCase(String.valueOf(v.getSeverity()))).count();

        long patched = vulns.stream().mapToLong(v -> v.getPatchedAssets() != null ? v.getPatchedAssets() : 0).sum();
        long pending = vulns.stream().mapToLong(v -> v.getPendingAssets() != null ? v.getPendingAssets() : 0).sum();

        map.put("critical", critical);
        map.put("high", high);
        map.put("medium", medium);
        map.put("low", low);
        map.put("totalPatchedAssets", patched);
        map.put("totalPendingAssets", pending);
        return map;
    }

    private Map<String, Object> calculateIncidentBreakdown(List<Incident> incidents) {
        Map<String, Object> map = new TreeMap<>();
        long open = incidents.stream().filter(i -> i.getStatus() != null && "OPEN".equalsIgnoreCase(i.getStatus().name())).count();
        long investigating = incidents.stream().filter(i -> i.getStatus() != null && "INVESTIGATING".equalsIgnoreCase(i.getStatus().name())).count();
        long resolved = incidents.stream().filter(i -> i.getStatus() != null && "RESOLVED".equalsIgnoreCase(i.getStatus().name())).count();
        map.put("open", open);
        map.put("investigating", investigating);
        map.put("resolved", resolved);
        map.put("total", incidents.size());
        return map;
    }
}
