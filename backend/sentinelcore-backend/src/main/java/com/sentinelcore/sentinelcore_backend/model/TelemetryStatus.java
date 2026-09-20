package com.sentinelcore.sentinelcore_backend.model;

import java.time.LocalDateTime;

public class TelemetryStatus {

    private boolean prometheusConnected;
    private boolean windowsExporterConnected;
    private String hostName;
    private String osName;
    private String architecture;
    private int availableProcessors;
    private double currentCpu;
    private double currentMemory;
    private double currentDisk;
    private double currentNetworkIn;
    private double currentNetworkOut;
    private String uptime;
    private String telemetrySource;
    private boolean fallback;
    private String fallbackReason;
    private LocalDateTime lastSyncTime;
    private boolean blackboxExporterConnected;
    private Double currentNetworkLatency;
    private Double currentNetworkPacketLoss;

    public TelemetryStatus() {
    }

    public boolean isPrometheusConnected() {
        return prometheusConnected;
    }

    public void setPrometheusConnected(boolean prometheusConnected) {
        this.prometheusConnected = prometheusConnected;
    }

    public boolean isWindowsExporterConnected() {
        return windowsExporterConnected;
    }

    public void setWindowsExporterConnected(boolean windowsExporterConnected) {
        this.windowsExporterConnected = windowsExporterConnected;
    }

    public String getHostName() {
        return hostName;
    }

    public void setHostName(String hostName) {
        this.hostName = hostName;
    }

    public String getOsName() {
        return osName;
    }

    public void setOsName(String osName) {
        this.osName = osName;
    }

    public String getArchitecture() {
        return architecture;
    }

    public void setArchitecture(String architecture) {
        this.architecture = architecture;
    }

    public int getAvailableProcessors() {
        return availableProcessors;
    }

    public void setAvailableProcessors(int availableProcessors) {
        this.availableProcessors = availableProcessors;
    }

    public double getCurrentCpu() {
        return currentCpu;
    }

    public void setCurrentCpu(double currentCpu) {
        this.currentCpu = currentCpu;
    }

    public double getCurrentMemory() {
        return currentMemory;
    }

    public void setCurrentMemory(double currentMemory) {
        this.currentMemory = currentMemory;
    }

    public double getCurrentDisk() {
        return currentDisk;
    }

    public void setCurrentDisk(double currentDisk) {
        this.currentDisk = currentDisk;
    }

    public double getCurrentNetworkIn() {
        return currentNetworkIn;
    }

    public void setCurrentNetworkIn(double currentNetworkIn) {
        this.currentNetworkIn = currentNetworkIn;
    }

    public double getCurrentNetworkOut() {
        return currentNetworkOut;
    }

    public void setCurrentNetworkOut(double currentNetworkOut) {
        this.currentNetworkOut = currentNetworkOut;
    }

    public String getUptime() {
        return uptime;
    }

    public void setUptime(String uptime) {
        this.uptime = uptime;
    }

    public String getTelemetrySource() {
        return telemetrySource;
    }

    public void setTelemetrySource(String telemetrySource) {
        this.telemetrySource = telemetrySource;
    }

    public boolean isFallback() {
        return fallback;
    }

    public void setFallback(boolean fallback) {
        this.fallback = fallback;
    }

    public String getFallbackReason() {
        return fallbackReason;
    }

    public void setFallbackReason(String fallbackReason) {
        this.fallbackReason = fallbackReason;
    }

    public LocalDateTime getLastSyncTime() {
        return lastSyncTime;
    }

    public void setLastSyncTime(LocalDateTime lastSyncTime) {
        this.lastSyncTime = lastSyncTime;
    }

    public boolean isBlackboxExporterConnected() {
        return blackboxExporterConnected;
    }

    public void setBlackboxExporterConnected(boolean blackboxExporterConnected) {
        this.blackboxExporterConnected = blackboxExporterConnected;
    }

    public Double getCurrentNetworkLatency() {
        return currentNetworkLatency;
    }

    public void setCurrentNetworkLatency(Double currentNetworkLatency) {
        this.currentNetworkLatency = currentNetworkLatency;
    }

    public Double getCurrentNetworkPacketLoss() {
        return currentNetworkPacketLoss;
    }

    public void setCurrentNetworkPacketLoss(Double currentNetworkPacketLoss) {
        this.currentNetworkPacketLoss = currentNetworkPacketLoss;
    }
}
