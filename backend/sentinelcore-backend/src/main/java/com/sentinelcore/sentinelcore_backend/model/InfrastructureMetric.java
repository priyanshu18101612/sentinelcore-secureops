package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "infrastructure_metrics")
public class InfrastructureMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "asset_id", nullable = false)
    private Long assetId;

    @Column(name = "cpu_usage")
    private double cpuUsage;

    @Column(name = "memory_usage")
    private double memoryUsage;

    @Column(name = "disk_usage")
    private double diskUsage;

    @Column(name = "network_in")
    private double networkIn;

    @Column(name = "network_out")
    private double networkOut;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    public InfrastructureMetric() {
    }

    public InfrastructureMetric(
            Long id,
            Long assetId,
            double cpuUsage,
            double memoryUsage,
            double diskUsage,
            double networkIn,
            double networkOut,
            String timestamp) {

        this.id = id;
        this.assetId = assetId;
        this.cpuUsage = cpuUsage;
        this.memoryUsage = memoryUsage;
        this.diskUsage = diskUsage;
        this.networkIn = networkIn;
        this.networkOut = networkOut;

        if (timestamp != null) {
            this.timestamp = LocalDateTime.parse(timestamp);
        }
    }

    public InfrastructureMetric(
            Long id,
            Long assetId,
            double cpuUsage,
            double memoryUsage,
            double diskUsage,
            double networkIn,
            double networkOut,
            LocalDateTime timestamp) {

        this.id = id;
        this.assetId = assetId;
        this.cpuUsage = cpuUsage;
        this.memoryUsage = memoryUsage;
        this.diskUsage = diskUsage;
        this.networkIn = networkIn;
        this.networkOut = networkOut;
        this.timestamp = timestamp;
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

    public double getCpuUsage() {
        return cpuUsage;
    }

    public void setCpuUsage(double cpuUsage) {
        this.cpuUsage = cpuUsage;
    }

    public double getMemoryUsage() {
        return memoryUsage;
    }

    public void setMemoryUsage(double memoryUsage) {
        this.memoryUsage = memoryUsage;
    }

    public double getDiskUsage() {
        return diskUsage;
    }

    public void setDiskUsage(double diskUsage) {
        this.diskUsage = diskUsage;
    }

    public double getNetworkIn() {
        return networkIn;
    }

    public void setNetworkIn(double networkIn) {
        this.networkIn = networkIn;
    }

    public double getNetworkOut() {
        return networkOut;
    }

    public void setNetworkOut(double networkOut) {
        this.networkOut = networkOut;
    }

    public String getTimestamp() {
        return timestamp != null ? timestamp.toString() : null;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp != null
                ? LocalDateTime.parse(timestamp)
                : null;
    }

    public LocalDateTime getTimestampValue() {
        return timestamp;
    }

    public void setTimestampValue(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}