package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_id", nullable = false)
    private Long incidentId;

    @Column(nullable = false)
    private String action;

    @Column
    private String actor;

    @Column
    private String source;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(length = 2000)
    private String details;

    public AuditLog() {
    }

    public AuditLog(Long incidentId, String action, String actor,
                    String source, LocalDateTime timestamp, String details) {
        this.incidentId = incidentId;
        this.action = action;
        this.actor = actor;
        this.source = source;
        this.timestamp = timestamp;
        this.details = details;
    }

    public Long getId() {
        return id;
    }

    public Long getIncidentId() {
        return incidentId;
    }

    public void setIncidentId(Long incidentId) {
        this.incidentId = incidentId;
    }

    public String getAction() {
        return action;
    }

    public void setAction(String action) {
        this.action = action;
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getDetails() {
        return details;
    }

    public void setDetails(String details) {
        this.details = details;
    }
}