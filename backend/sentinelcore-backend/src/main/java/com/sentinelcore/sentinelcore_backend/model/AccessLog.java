package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "access_logs")
public class AccessLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(name = "ip_address")
    private String ipAddress;

    @Column(name = "event_type", nullable = false)
    private String eventType; // LOGIN_SUCCESS, LOGIN_FAILURE, LOGOUT, PRIVILEGE_ELEVATION

    @Column(nullable = false)
    private String status; // SUCCESS, FAILED

    @Column(name = "failure_reason")
    private String failureReason;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    public AccessLog() {
    }

    public AccessLog(String username, String ipAddress, String eventType,
                     String status, String failureReason, String userAgent,
                     LocalDateTime timestamp) {
        this.username = username;
        this.ipAddress = ipAddress;
        this.eventType = eventType;
        this.status = status;
        this.failureReason = failureReason;
        this.userAgent = userAgent;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getEventType() {
        return eventType;
    }

    public void setEventType(String eventType) {
        this.eventType = eventType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getFailureReason() {
        return failureReason;
    }

    public void setFailureReason(String failureReason) {
        this.failureReason = failureReason;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
