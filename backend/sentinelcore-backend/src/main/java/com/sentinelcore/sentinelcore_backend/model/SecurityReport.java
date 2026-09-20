package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_reports")
public class SecurityReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "report_type", nullable = false)
    private String reportType; // ACCESS_REPORT, SECURITY_REPORT, COMPLIANCE_REPORT, DEVSECOPS_REPORT

    @Column(nullable = false)
    private String title;

    @Column(name = "generated_by", nullable = false)
    private String generatedBy;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt;

    @Column(name = "summary_data", length = 10000)
    private String summaryData; // JSON or key-value metric summary

    @Column(nullable = false)
    private String status; // READY, GENERATING

    public SecurityReport() {
    }

    public SecurityReport(String reportType, String title, String generatedBy,
                          LocalDateTime generatedAt, String summaryData, String status) {
        this.reportType = reportType;
        this.title = title;
        this.generatedBy = generatedBy;
        this.generatedAt = generatedAt;
        this.summaryData = summaryData;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public String getReportType() {
        return reportType;
    }

    public void setReportType(String reportType) {
        this.reportType = reportType;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getGeneratedBy() {
        return generatedBy;
    }

    public void setGeneratedBy(String generatedBy) {
        this.generatedBy = generatedBy;
    }

    public LocalDateTime getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(LocalDateTime generatedAt) {
        this.generatedAt = generatedAt;
    }

    public String getSummaryData() {
        return summaryData;
    }

    public void setSummaryData(String summaryData) {
        this.summaryData = summaryData;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
