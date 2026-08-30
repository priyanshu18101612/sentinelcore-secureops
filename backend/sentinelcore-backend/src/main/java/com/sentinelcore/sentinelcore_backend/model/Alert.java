package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alerts")
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id")
    private Long assetId;

    @Column(name = "alert_type", nullable = false, length = 50)
    private String alertType;

    @Column(nullable = false, length = 20)
    private String severity;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "acknowledged_at")
    private LocalDateTime acknowledgedAt;

    public Alert() {
    }

    // Constructor used by the existing AlertService
    public Alert(
            Long id,
            Long assetId,
            String alertType,
            String severity,
            String message,
            String status,
            String createdAt,
            String acknowledgedAt) {

        this.id = id;
        this.assetId = assetId;
        this.alertType = alertType;
        this.severity = severity;
        this.message = message;
        this.status = status;

        if (createdAt != null) {
            this.createdAt = LocalDateTime.parse(createdAt);
        }

        if (acknowledgedAt != null) {
            this.acknowledgedAt = LocalDateTime.parse(acknowledgedAt);
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getAlertType() {
        return alertType;
    }

    public void setAlertType(String alertType) {
        this.alertType = alertType;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCreatedAt() {
        return createdAt != null ? createdAt.toString() : null;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt != null
                ? LocalDateTime.parse(createdAt)
                : null;
    }

    public String getAcknowledgedAt() {
        return acknowledgedAt != null ? acknowledgedAt.toString() : null;
    }

    public void setAcknowledgedAt(String acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt != null
                ? LocalDateTime.parse(acknowledgedAt)
                : null;
    }

    public LocalDateTime getCreatedAtValue() {
        return createdAt;
    }

    public void setCreatedAtValue(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getAcknowledgedAtValue() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAtValue(LocalDateTime acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }
}