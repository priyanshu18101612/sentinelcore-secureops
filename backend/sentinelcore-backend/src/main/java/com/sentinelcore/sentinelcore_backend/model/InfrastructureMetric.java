package com.sentinelcore.sentinelcore_backend.model;

public class InfrastructureMetric {

    private Long id;
    private Long assetId;
    private double cpuUsage;
    private double memoryUsage;
    private double diskUsage;
    private double networkIn;
    private double networkOut;
    private String timestamp;

    public InfrastructureMetric() {
    }

    public InfrastructureMetric(Long id, Long assetId,
                                 double cpuUsage, double memoryUsage,
                                 double diskUsage, double networkIn,
                                 double networkOut, String timestamp) {
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
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}