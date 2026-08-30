package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "network_metrics")
public class NetworkMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "network_name", nullable = false, length = 100)
    private String networkName;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "network_in")
    private Double networkIn;

    @Column(name = "network_out")
    private Double networkOut;

    @Column
    private Double latency;

    @Column(name = "packet_loss")
    private Double packetLoss;

    @Column(nullable = false)
    private LocalDateTime timestamp;

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
        this.timestamp = LocalDateTime.parse(timestamp);
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

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}