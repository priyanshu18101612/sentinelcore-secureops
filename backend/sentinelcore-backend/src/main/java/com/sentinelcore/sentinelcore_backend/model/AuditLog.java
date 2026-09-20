package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "incident_id")
    private Long incidentId;

    @Column(name = "entity_type")
    private String entityType;

    @Column(name = "entity_id")
    private String entityId;

    @Column(name = "category")
    private String category;

    @Column(name = "previous_hash", length = 64)
    private String previousHash;

    @Column(name = "hash", length = 64)
    private String hash;

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
        this.entityType = incidentId != null ? "INCIDENT" : "GENERAL";
        this.entityId = incidentId != null ? String.valueOf(incidentId) : null;
        this.category = "INCIDENT_MANAGEMENT";
        this.action = action;
        this.actor = actor;
        this.source = source;
        this.timestamp = timestamp;
        this.details = details;
    }

    public AuditLog(Long incidentId, String entityType, String entityId, String category,
                    String action, String actor, String source, LocalDateTime timestamp,
                    String details, String previousHash, String hash) {
        this.incidentId = incidentId;
        this.entityType = entityType;
        this.entityId = entityId;
        this.category = category;
        this.action = action;
        this.actor = actor;
        this.source = source;
        this.timestamp = timestamp;
        this.details = details;
        this.previousHash = previousHash;
        this.hash = hash;
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

    public String getEntityType() {
        return entityType;
    }

    public void setEntityType(String entityType) {
        this.entityType = entityType;
    }

    public String getEntityId() {
        return entityId;
    }

    public void setEntityId(String entityId) {
        this.entityId = entityId;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getPreviousHash() {
        return previousHash;
    }

    public void setPreviousHash(String previousHash) {
        this.previousHash = previousHash;
    }

    public String getHash() {
        return hash;
    }

    public void setHash(String hash) {
        this.hash = hash;
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