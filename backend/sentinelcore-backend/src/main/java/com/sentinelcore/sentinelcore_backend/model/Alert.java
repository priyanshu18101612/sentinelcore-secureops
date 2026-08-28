package com.sentinelcore.sentinelcore_backend.model;

public class Alert {

    private Long id;
    private Long assetId;
    private String alertType;
    private String severity;
    private String message;
    private String status;
    private String createdAt;
    private String acknowledgedAt;

    public Alert() {
    }

    public Alert(Long id, Long assetId, String alertType,
                 String severity, String message, String status,
                 String createdAt, String acknowledgedAt) {
        this.id = id;
        this.assetId = assetId;
        this.alertType = alertType;
        this.severity = severity;
        this.message = message;
        this.status = status;
        this.createdAt = createdAt;
        this.acknowledgedAt = acknowledgedAt;
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
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getAcknowledgedAt() {
        return acknowledgedAt;
    }

    public void setAcknowledgedAt(String acknowledgedAt) {
        this.acknowledgedAt = acknowledgedAt;
    }
}