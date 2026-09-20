package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_reviews")
public class SecurityReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "review_period", nullable = false)
    private String reviewPeriod; // e.g. "Last 30 Days"

    @Column(name = "start_date", nullable = false)
    private LocalDateTime startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDateTime endDate;

    @Column(nullable = false)
    private String status; // PENDING, FLAGGED, APPROVED

    @Column(name = "anomalies_detected", nullable = false)
    private int anomaliesDetected;

    @Column(name = "reviewer_name")
    private String reviewerName;

    @Column(name = "reviewer_role")
    private String reviewerRole;

    @Column(length = 2000)
    private String notes;

    @Column(name = "signed_at")
    private LocalDateTime signedAt;

    public SecurityReview() {
    }

    public SecurityReview(String reviewPeriod, LocalDateTime startDate, LocalDateTime endDate,
                          String status, int anomaliesDetected, String reviewerName,
                          String reviewerRole, String notes, LocalDateTime signedAt) {
        this.reviewPeriod = reviewPeriod;
        this.startDate = startDate;
        this.endDate = endDate;
        this.status = status;
        this.anomaliesDetected = anomaliesDetected;
        this.reviewerName = reviewerName;
        this.reviewerRole = reviewerRole;
        this.notes = notes;
        this.signedAt = signedAt;
    }

    public Long getId() {
        return id;
    }

    public String getReviewPeriod() {
        return reviewPeriod;
    }

    public void setReviewPeriod(String reviewPeriod) {
        this.reviewPeriod = reviewPeriod;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public int getAnomaliesDetected() {
        return anomaliesDetected;
    }

    public void setAnomaliesDetected(int anomaliesDetected) {
        this.anomaliesDetected = anomaliesDetected;
    }

    public String getReviewerName() {
        return reviewerName;
    }

    public void setReviewerName(String reviewerName) {
        this.reviewerName = reviewerName;
    }

    public String getReviewerRole() {
        return reviewerRole;
    }

    public void setReviewerRole(String reviewerRole) {
        this.reviewerRole = reviewerRole;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public LocalDateTime getSignedAt() {
        return signedAt;
    }

    public void setSignedAt(LocalDateTime signedAt) {
        this.signedAt = signedAt;
    }
}
