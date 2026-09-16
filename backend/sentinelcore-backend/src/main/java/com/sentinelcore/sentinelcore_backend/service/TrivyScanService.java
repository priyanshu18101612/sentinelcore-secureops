package com.sentinelcore.sentinelcore_backend.service;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.sentinelcore.sentinelcore_backend.model.PatchStatus;
import com.sentinelcore.sentinelcore_backend.model.Vulnerability;
import com.sentinelcore.sentinelcore_backend.model.VulnerabilitySeverity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.*;

@Service
public class TrivyScanService {

    private final VulnerabilityService vulnerabilityService;
    private final ObjectMapper objectMapper;

    public TrivyScanService(VulnerabilityService vulnerabilityService, ObjectMapper objectMapper) {
        this.vulnerabilityService = vulnerabilityService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> processTrivyReport(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Scan report file is empty or missing");
        }

        JsonNode root;
        try (InputStream is = file.getInputStream()) {
            root = objectMapper.readTree(is);
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid JSON report file: " + e.getMessage());
        }

        if (root == null || !root.isObject()) {
            throw new IllegalArgumentException("Invalid Trivy report format: root must be a JSON object");
        }

        JsonNode resultsNode = root.get("Results");
        if (resultsNode == null || !resultsNode.isArray()) {
            throw new IllegalArgumentException("Invalid Trivy report: missing 'Results' array");
        }

        // Parse scan timestamp
        LocalDateTime scanTimestamp = parseScanTimestamp(root);
        String reportId = root.hasNonNull("ReportID") ? root.get("ReportID").asText() : null;

        // Retrieve existing vulnerabilities for duplicate detection
        List<Vulnerability> existingVulns = new ArrayList<>(vulnerabilityService.getAllVulnerabilities());
        Set<String> batchSignatures = new HashSet<>();

        List<Vulnerability> savedVulnerabilities = new ArrayList<>();
        int totalFindings = 0;
        int skippedDuplicates = 0;

        for (JsonNode resultNode : resultsNode) {
            JsonNode vulnsNode = resultNode.get("Vulnerabilities");
            if (vulnsNode == null || !vulnsNode.isArray()) {
                continue;
            }

            for (JsonNode vNode : vulnsNode) {
                totalFindings++;

                String rawVulnId = vNode.hasNonNull("VulnerabilityID") ? vNode.get("VulnerabilityID").asText().trim() : "";
                String pkgName = vNode.hasNonNull("PkgName") ? vNode.get("PkgName").asText().trim() : "";

                // Map VulnerabilityID -> CVE ID when it starts with CVE-
                String cveId = null;
                if (rawVulnId.toUpperCase().startsWith("CVE-")) {
                    cveId = rawVulnId.toUpperCase();
                }

                // Map Title -> title, with package name as fallback
                String title;
                if (vNode.hasNonNull("Title") && !vNode.get("Title").asText().trim().isEmpty()) {
                    title = vNode.get("Title").asText().trim();
                } else if (!pkgName.isEmpty()) {
                    title = pkgName + (!rawVulnId.isEmpty() ? " (" + rawVulnId + ")" : "");
                } else if (!rawVulnId.isEmpty()) {
                    title = rawVulnId;
                } else {
                    title = "Trivy Vulnerability";
                }

                // Map Description -> description
                String description = vNode.hasNonNull("Description") ? vNode.get("Description").asText().trim() : null;
                if (description != null && !pkgName.isEmpty() && !description.contains(pkgName)) {
                    description = "Affected Package: " + pkgName + "\n\n" + description;
                }

                // Map Trivy Severity -> existing VulnerabilitySeverity
                VulnerabilitySeverity severity = mapSeverity(vNode.hasNonNull("Severity") ? vNode.get("Severity").asText() : null);

                // Map best available CVSS v3 score -> cvssScore
                Double cvssScore = extractBestCvssV3Score(vNode);
                Double riskScore = cvssScore;

                // Duplicate protection: CVE + package identity
                String signature = makeSignature(cveId, pkgName, title);
                if (batchSignatures.contains(signature) || isDuplicate(cveId, pkgName, title, existingVulns)) {
                    skippedDuplicates++;
                    continue;
                }
                batchSignatures.add(signature);

                // Construct Vulnerability using existing entity and service
                Vulnerability vulnerability = new Vulnerability();
                vulnerability.setCveId(cveId);
                vulnerability.setTitle(title);
                vulnerability.setDescription(description);
                vulnerability.setSeverity(severity);
                vulnerability.setCvssScore(cvssScore);
                vulnerability.setRiskScore(riskScore);
                vulnerability.setAffectedAssets(1);
                vulnerability.setPatchedAssets(0);
                vulnerability.setPendingAssets(1);
                vulnerability.setPatchStatus(PatchStatus.PENDING);
                vulnerability.setScanSource("Trivy");
                vulnerability.setDetectedAt(scanTimestamp);
                vulnerability.setVulnerabilityId(null); // Leave blank so VulnerabilityService generates VULN-YYYY-NNN

                Vulnerability saved = vulnerabilityService.createVulnerability(vulnerability);
                savedVulnerabilities.add(saved);
                existingVulns.add(saved);
            }
        }

        if (totalFindings == 0) {
            throw new IllegalArgumentException("Trivy report is empty or contains no vulnerability findings");
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Trivy scan report processed successfully");
        response.put("scanSource", "Trivy");
        response.put("reportId", reportId);
        response.put("totalFindings", totalFindings);
        response.put("savedFindings", savedVulnerabilities.size());
        response.put("skippedDuplicates", skippedDuplicates);
        response.put("vulnerabilities", savedVulnerabilities);

        return response;
    }

    private LocalDateTime parseScanTimestamp(JsonNode root) {
        if (root.hasNonNull("CreatedAt")) {
            try {
                return OffsetDateTime.parse(root.get("CreatedAt").asText()).toLocalDateTime();
            } catch (Exception e) {
                try {
                    return LocalDateTime.parse(root.get("CreatedAt").asText());
                } catch (Exception ignored) {}
            }
        }
        return LocalDateTime.now();
    }

    private VulnerabilitySeverity mapSeverity(String rawSeverity) {
        if (rawSeverity == null) return VulnerabilitySeverity.LOW;
        switch (rawSeverity.trim().toUpperCase()) {
            case "CRITICAL":
                return VulnerabilitySeverity.CRITICAL;
            case "HIGH":
                return VulnerabilitySeverity.HIGH;
            case "MEDIUM":
                return VulnerabilitySeverity.MEDIUM;
            case "LOW":
            default:
                return VulnerabilitySeverity.LOW;
        }
    }

    private Double extractBestCvssV3Score(JsonNode vNode) {
        JsonNode cvssNode = vNode.get("CVSS");
        if (cvssNode == null || !cvssNode.isObject()) {
            return null;
        }

        Double highestScore = null;
        for (Map.Entry<String, JsonNode> entry : cvssNode.properties()) {
            JsonNode vendorNode = entry.getValue();
            if (vendorNode != null && vendorNode.isObject()) {
                JsonNode v3ScoreNode = vendorNode.get("V3Score");
                if (v3ScoreNode != null && v3ScoreNode.isNumber()) {
                    double score = v3ScoreNode.asDouble();
                    if (score >= 0.0 && score <= 10.0) {
                        if (highestScore == null || score > highestScore) {
                            highestScore = score;
                        }
                    }
                }
            }
        }

        if (highestScore != null) {
            return Math.round(highestScore * 10.0) / 10.0;
        }
        return null;
    }

    private String makeSignature(String cveId, String pkgName, String title) {
        String cve = (cveId != null) ? cveId.trim().toUpperCase() : "";
        String pkg = (pkgName != null) ? pkgName.trim().toLowerCase() : "";
        if (!cve.isEmpty() && !pkg.isEmpty()) {
            return cve + "::" + pkg;
        } else if (!cve.isEmpty()) {
            return cve;
        } else {
            return (title != null ? title.trim().toLowerCase() : "") + "::" + pkg;
        }
    }

    private boolean isDuplicate(String cveId, String pkgName, String title, List<Vulnerability> existingVulns) {
        if (existingVulns == null || existingVulns.isEmpty()) {
            return false;
        }

        String incomingSig = makeSignature(cveId, pkgName, title);

        for (Vulnerability existing : existingVulns) {
            if (cveId != null && cveId.equalsIgnoreCase(existing.getCveId())) {
                // Same CVE from Trivy
                if ("Trivy".equalsIgnoreCase(existing.getScanSource())) {
                    // Check package match if package is known
                    if (pkgName != null && !pkgName.isEmpty()) {
                        String desc = existing.getDescription();
                        String exTitle = existing.getTitle();
                        if ((desc != null && desc.toLowerCase().contains(pkgName.toLowerCase()))
                                || (exTitle != null && exTitle.toLowerCase().contains(pkgName.toLowerCase()))) {
                            return true;
                        }
                    }
                    // If no specific package distinction or matches CVE
                    return true;
                }
            }

            // Fallback to signature matching on title
            String existingSig = makeSignature(existing.getCveId(), null, existing.getTitle());
            if (incomingSig.equals(existingSig)) {
                return true;
            }
        }

        return false;
    }
}
