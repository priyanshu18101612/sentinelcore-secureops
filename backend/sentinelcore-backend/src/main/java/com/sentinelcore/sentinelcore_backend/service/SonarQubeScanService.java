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
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
public class SonarQubeScanService {

    private final VulnerabilityService vulnerabilityService;
    private final ObjectMapper objectMapper;

    public SonarQubeScanService(VulnerabilityService vulnerabilityService, ObjectMapper objectMapper) {
        this.vulnerabilityService = vulnerabilityService;
        this.objectMapper = objectMapper;
    }

    public Map<String, Object> processSonarQubeReport(MultipartFile file) {
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
            throw new IllegalArgumentException("Invalid SonarQube report format: root must be a JSON object");
        }

        JsonNode issuesNode = root.get("issues");
        if (issuesNode == null || !issuesNode.isArray()) {
            throw new IllegalArgumentException("Invalid SonarQube report: missing 'issues' array");
        }

        if (issuesNode.isEmpty()) {
            throw new IllegalArgumentException("SonarQube report contains no issues");
        }

        List<Vulnerability> existingVulns = new ArrayList<>(vulnerabilityService.getAllVulnerabilities());
        Set<String> batchSignatures = new HashSet<>();

        List<Vulnerability> savedVulnerabilities = new ArrayList<>();
        int totalFindings = 0;
        int skippedDuplicates = 0;

        for (JsonNode issueNode : issuesNode) {
            totalFindings++;

            String key = issueNode.hasNonNull("key") ? issueNode.get("key").asText().trim() : "";
            String rule = issueNode.hasNonNull("rule") ? issueNode.get("rule").asText().trim() : "";
            String component = issueNode.hasNonNull("component") ? issueNode.get("component").asText().trim() : "";
            Integer line = issueNode.hasNonNull("line") ? issueNode.get("line").asInt() : null;
            String message = issueNode.hasNonNull("message") ? issueNode.get("message").asText().trim() : "";
            String effort = issueNode.hasNonNull("effort") ? issueNode.get("effort").asText().trim() : "";
            String debt = issueNode.hasNonNull("debt") ? issueNode.get("debt").asText().trim() : "";
            String creationDateStr = issueNode.hasNonNull("creationDate") ? issueNode.get("creationDate").asText().trim() : null;

            // 1. rule / CWE tag -> cveId field
            String cveId = extractCveOrRule(issueNode, rule);

            // 2. message -> title
            String title = !message.isEmpty() ? message : (!rule.isEmpty() ? rule : "SonarQube Finding");

            // 3. rule + component + line + effort/debt -> description
            String description = buildDescription(key, rule, component, line, effort, debt, message);

            // 4. Sonar severity -> existing VulnerabilitySeverity & consistent CVSS baseline
            String rawSeverity = issueNode.hasNonNull("severity") ? issueNode.get("severity").asText().trim().toUpperCase() : "INFO";
            VulnerabilitySeverity severity = mapSeverity(rawSeverity);
            Double cvssScore = deriveCvssScore(rawSeverity);
            Double riskScore = cvssScore;

            // 5. Parse creationDate -> detectedAt
            LocalDateTime detectedAt = parseDate(creationDateStr);

            // 6. Duplicate protection: rule + component or key
            String signature = makeSignature(key, rule, component, line);
            if (batchSignatures.contains(signature) || isDuplicate(key, rule, component, line, existingVulns)) {
                skippedDuplicates++;
                continue;
            }
            batchSignatures.add(signature);

            // 7. Construct Vulnerability entity
            Vulnerability vuln = new Vulnerability();
            vuln.setCveId(cveId);
            vuln.setTitle(title);
            vuln.setDescription(description);
            vuln.setSeverity(severity);
            vuln.setCvssScore(cvssScore);
            vuln.setRiskScore(riskScore);
            vuln.setAffectedAssets(1);
            vuln.setPatchedAssets(0);
            vuln.setPendingAssets(1);
            vuln.setPatchStatus(PatchStatus.PENDING);
            vuln.setScanSource("SonarQube");
            vuln.setDetectedAt(detectedAt);
            vuln.setVulnerabilityId(null); // leave blank so existing service generates it

            Vulnerability saved = vulnerabilityService.createVulnerability(vuln);
            savedVulnerabilities.add(saved);
            existingVulns.add(saved);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "SonarQube scan report processed successfully");
        response.put("scanSource", "SonarQube");
        response.put("totalFindings", totalFindings);
        response.put("savedFindings", savedVulnerabilities.size());
        response.put("skippedDuplicates", skippedDuplicates);
        response.put("vulnerabilities", savedVulnerabilities);

        return response;
    }

    private String extractCveOrRule(JsonNode issueNode, String rule) {
        JsonNode tagsNode = issueNode.get("tags");
        if (tagsNode != null && tagsNode.isArray()) {
            for (JsonNode tagNode : tagsNode) {
                String tag = tagNode.asText().trim();
                if (tag.toLowerCase().startsWith("cwe-") || tag.toLowerCase().startsWith("cve-")) {
                    return tag.toUpperCase();
                }
            }
        }
        return !rule.isEmpty() ? rule : null;
    }

    private String buildDescription(String key, String rule, String component, Integer line, String effort, String debt, String message) {
        StringBuilder sb = new StringBuilder();
        if (!rule.isEmpty()) {
            sb.append("Rule: ").append(rule);
        }
        if (!component.isEmpty()) {
            if (sb.length() > 0) sb.append(" | ");
            sb.append("File: ").append(component);
            if (line != null) {
                sb.append(" (Line ").append(line).append(")");
            }
        }
        String effortOrDebt = !debt.isEmpty() ? debt : effort;
        if (!effortOrDebt.isEmpty()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append("Remediation Effort: ").append(effortOrDebt);
        }
        if (!key.isEmpty()) {
            if (sb.length() > 0) sb.append("\n");
            sb.append("Issue Key: ").append(key);
        }
        if (!message.isEmpty()) {
            if (sb.length() > 0) sb.append("\n\n");
            sb.append(message);
        }
        return sb.toString();
    }

    private VulnerabilitySeverity mapSeverity(String rawSeverity) {
        if (rawSeverity == null) return VulnerabilitySeverity.LOW;
        switch (rawSeverity) {
            case "BLOCKER":
            case "CRITICAL":
                return VulnerabilitySeverity.CRITICAL;
            case "MAJOR":
                return VulnerabilitySeverity.HIGH;
            case "MINOR":
                return VulnerabilitySeverity.MEDIUM;
            case "INFO":
            default:
                return VulnerabilitySeverity.LOW;
        }
    }

    private Double deriveCvssScore(String rawSeverity) {
        if (rawSeverity == null) return 2.0;
        switch (rawSeverity) {
            case "BLOCKER":
                return 9.5;
            case "CRITICAL":
                return 8.5;
            case "MAJOR":
                return 6.5;
            case "MINOR":
                return 4.0;
            case "INFO":
            default:
                return 2.0;
        }
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null || dateStr.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ssXX");
            return OffsetDateTime.parse(dateStr, formatter).toLocalDateTime();
        } catch (Exception e1) {
            try {
                return OffsetDateTime.parse(dateStr).toLocalDateTime();
            } catch (Exception e2) {
                try {
                    return LocalDateTime.parse(dateStr);
                } catch (Exception e3) {
                    return LocalDateTime.now();
                }
            }
        }
    }

    private String makeSignature(String key, String rule, String component, Integer line) {
        if (key != null && !key.isEmpty()) {
            return "KEY::" + key;
        }
        return (rule != null ? rule : "") + "::" + (component != null ? component : "") + "::" + (line != null ? line : 0);
    }

    private boolean isDuplicate(String key, String rule, String component, Integer line, List<Vulnerability> existingVulns) {
        if (existingVulns == null || existingVulns.isEmpty()) {
            return false;
        }

        for (Vulnerability existing : existingVulns) {
            if ("SonarQube".equalsIgnoreCase(existing.getScanSource())) {
                String desc = existing.getDescription() != null ? existing.getDescription() : "";
                if (!key.isEmpty() && desc.contains("Issue Key: " + key)) {
                    return true;
                }
                if (!rule.isEmpty() && !component.isEmpty()) {
                    if (desc.contains("Rule: " + rule) && desc.contains("File: " + component)) {
                        if (line != null && desc.contains("Line " + line)) {
                            return true;
                        } else if (line == null) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }
}
