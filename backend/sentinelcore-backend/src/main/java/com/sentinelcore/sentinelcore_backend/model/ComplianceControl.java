package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "compliance_controls")
public class ComplianceControl {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String framework; // PCI_DSS, SOC_2, ISO_27001

    @Column(name = "control_id", nullable = false)
    private String controlId; // e.g. PCI-6.2, SOC2-CC7.1, ISO-A.12.6.1

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String category;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false)
    private String status; // PASSED, FAILED, WARNING

    @Column(name = "last_evaluated_at")
    private LocalDateTime lastEvaluatedAt;

    @Column(name = "evidence_summary", length = 2000)
    private String evidenceSummary;

    public ComplianceControl() {
    }

    public ComplianceControl(String framework, String controlId, String title,
                             String category, String description, String status,
                             LocalDateTime lastEvaluatedAt, String evidenceSummary) {
        this.framework = framework;
        this.controlId = controlId;
        this.title = title;
        this.category = category;
        this.description = description;
        this.status = status;
        this.lastEvaluatedAt = lastEvaluatedAt;
        this.evidenceSummary = evidenceSummary;
    }

    public Long getId() {
        return id;
    }

    public String getFramework() {
        return framework;
    }

    public void setFramework(String framework) {
        this.framework = framework;
    }

    public String getControlId() {
        return controlId;
    }

    public void setControlId(String controlId) {
        this.controlId = controlId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastEvaluatedAt() {
        return lastEvaluatedAt;
    }

    public void setLastEvaluatedAt(LocalDateTime lastEvaluatedAt) {
        this.lastEvaluatedAt = lastEvaluatedAt;
    }

    public String getEvidenceSummary() {
        return evidenceSummary;
    }

    public void setEvidenceSummary(String evidenceSummary) {
        this.evidenceSummary = evidenceSummary;
    }
}
