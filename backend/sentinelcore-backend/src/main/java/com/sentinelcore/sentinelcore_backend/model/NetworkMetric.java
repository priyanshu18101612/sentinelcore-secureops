package com.sentinelcore.sentinelcore_backend.model;

public class NetworkMetric {

    private Long id;
    private String networkName;
    private String status;
    private Double networkIn;
    private Double networkOut;
    private Double latency;
    private Double packetLoss;
    private String timestamp;

    public NetworkMetric() {
    }

    public NetworkMetric(Long id, String networkName, String status,
                         Double networkIn, Double networkOut,
                         Double latency, Double packetLoss,
                         String timestamp) {
        this.id = id;
        this.networkName = networkName;
        this.status = status;
        this.networkIn = networkIn;
        this.networkOut = networkOut;
        this.latency = latency;
        this.packetLoss = packetLoss;
        this.timestamp = timestamp;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNetworkName() {
        return networkName;
    }

    public void setNetworkName(String networkName) {
        this.networkName = networkName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Double getNetworkIn() {
        return networkIn;
    }

    public void setNetworkIn(Double networkIn) {
        this.networkIn = networkIn;
    }

    public Double getNetworkOut() {
        return networkOut;
    }

    public void setNetworkOut(Double networkOut) {
        this.networkOut = networkOut;
    }

    public Double getLatency() {
        return latency;
    }

    public void setLatency(Double latency) {
        this.latency = latency;
    }

    public Double getPacketLoss() {
        return packetLoss;
    }

    public void setPacketLoss(Double packetLoss) {
        this.packetLoss = packetLoss;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }
}