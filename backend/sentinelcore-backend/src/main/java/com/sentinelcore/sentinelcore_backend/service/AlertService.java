package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.repository.AlertRepository;
import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    private final AlertRepository alertRepository;
    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository;

    // Configurable monitoring thresholds
    @Value("${alerts.threshold.cpu.warning:90.0}")
    private double cpuWarning;

    @Value("${alerts.threshold.cpu.critical:95.0}")
    private double cpuCritical;

    @Value("${alerts.threshold.memory.warning:90.0}")
    private double memoryWarning;

    @Value("${alerts.threshold.memory.critical:95.0}")
    private double memoryCritical;

    @Value("${alerts.threshold.disk.warning:85.0}")
    private double diskWarning;

    @Value("${alerts.threshold.disk.critical:92.0}")
    private double diskCritical;

    @Value("${alerts.threshold.network-latency.warning:50.0}")
    private double networkLatencyWarning;

    @Value("${alerts.threshold.network-latency.critical:100.0}")
    private double networkLatencyCritical;

    public AlertService(
            AlertRepository alertRepository,
            @Lazy IncidentService incidentService,
            IncidentRepository incidentRepository) {
        this.alertRepository = alertRepository;
        this.incidentService = incidentService;
        this.incidentRepository = incidentRepository;
    }

    // Get all alerts from PostgreSQL
    public List<Alert> getAllAlerts() {
        return alertRepository.findAll();
    }

    // Get alert by ID
    public Alert getAlertById(Long id) {
        return alertRepository.findById(id).orElse(null);
    }

    // Create a manual or monitoring alert
    public Alert createAlert(Alert alert) {
        if (alert.getStatus() == null) {
            alert.setStatus("OPEN");
        }
        if (alert.getCreatedAt() == null) {
            alert.setCreatedAt(LocalDateTime.now().toString());
        }
        return alertRepository.save(alert);
    }

    // Acknowledge an alert
    public Alert acknowledgeAlert(Long id) {
        Alert alert = getAlertById(id);
        if (alert != null) {
            alert.setStatus("ACKNOWLEDGED");
            alert.setAcknowledgedAt(LocalDateTime.now().toString());
            return alertRepository.save(alert);
        }
        return null;
    }

    // =========================================================
    // ANOMALY DETECTION + AUTOMATIC ALERT GENERATION
    // =========================================================

    public List<Alert> detectAnomalies(List<InfrastructureMetric> metrics) {
        List<Alert> generatedAlerts = new ArrayList<>();

        for (InfrastructureMetric metric : metrics) {
            // CPU anomaly
            if (metric.getCpuUsage() >= cpuWarning) {
                String severity = metric.getCpuUsage() >= cpuCritical ? "CRITICAL" : "HIGH";
                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_CPU_USAGE",
                        severity,
                        String.format("CPU usage reached %.2f%% (Warning: %.1f%%, Critical: %.1f%%)",
                                metric.getCpuUsage(), cpuWarning, cpuCritical)
                );
                generatedAlerts.add(alert);

                if (metric.getCpuUsage() >= cpuCritical) {
                    simulateAutoScaling(metric.getAssetId());
                }
            }

            // Memory anomaly
            if (metric.getMemoryUsage() >= memoryWarning) {
                String severity = metric.getMemoryUsage() >= memoryCritical ? "CRITICAL" : "HIGH";
                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_MEMORY_USAGE",
                        severity,
                        String.format("Memory usage reached %.2f%% (Warning: %.1f%%, Critical: %.1f%%)",
                                metric.getMemoryUsage(), memoryWarning, memoryCritical)
                );
                generatedAlerts.add(alert);
            }

            // Disk anomaly
            if (metric.getDiskUsage() >= diskWarning) {
                String severity = metric.getDiskUsage() >= diskCritical ? "CRITICAL" : "HIGH";
                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_DISK_USAGE",
                        severity,
                        String.format("Disk usage reached %.2f%% (Warning: %.1f%%, Critical: %.1f%%)",
                                metric.getDiskUsage(), diskWarning, diskCritical)
                );
                generatedAlerts.add(alert);
            }
        }

        return generatedAlerts;
    }

    public List<Alert> detectNetworkAnomalies(Long assetId, Double latency, Double packetLoss) {
        List<Alert> alerts = new ArrayList<>();
        if (latency == null || Double.isNaN(latency)) {
            return alerts;
        }
        if (latency >= networkLatencyWarning) {
            String severity = latency >= networkLatencyCritical ? "CRITICAL" : "HIGH";
            Alert alert = createMonitoringAlert(
                    assetId,
                    "HIGH_NETWORK_LATENCY",
                    severity,
                    String.format("Network latency reached %.2f ms (Warning: %.1f ms, Critical: %.1f ms)",
                            latency, networkLatencyWarning, networkLatencyCritical)
            );
            alerts.add(alert);
        }
        return alerts;
    }

    // =========================================================
    // CREATE MONITORING ALERT WITH DEDUPLICATION & ESCALATION
    // =========================================================

    public Alert createMonitoringAlert(
            Long assetId,
            String alertType,
            String severity,
            String message) {

        // Deduplication: maintain exactly ONE active ("OPEN") equivalent alert per asset + metric + severity
        List<Alert> existingActive = alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                assetId, alertType, severity, "OPEN");

        if (!existingActive.isEmpty()) {
            Alert activeAlert = existingActive.get(0);
            activeAlert.setMessage(message);
            return alertRepository.save(activeAlert);
        }

        // Create new Alert
        Alert alert = new Alert(
                null,
                assetId,
                alertType,
                severity,
                message,
                "OPEN",
                LocalDateTime.now().toString(),
                null
        );

        Alert savedAlert = createAlert(alert);

        // Auto-escalate CRITICAL alerts to Incident Management with deduplication
        if ("CRITICAL".equalsIgnoreCase(severity)) {
            escalateCriticalAlertToIncident(savedAlert);
        }

        return savedAlert;
    }

    // =========================================================
    // INCIDENT ESCALATION WITH DEDUPLICATION
    // =========================================================

    private void escalateCriticalAlertToIncident(Alert alert) {
        try {
            String incidentTitle = String.format("[CRITICAL] %s on Asset #%d",
                    alert.getAlertType(), alert.getAssetId());

            // Deduplication: do not create another incident while an equivalent incident is OPEN, ASSIGNED, or INVESTIGATING
            List<IncidentStatus> activeStatuses = List.of(
                    IncidentStatus.OPEN,
                    IncidentStatus.ASSIGNED,
                    IncidentStatus.INVESTIGATING
            );

            boolean incidentActive = incidentRepository.existsByTitleAndStatusIn(incidentTitle, activeStatuses);

            if (!incidentActive) {
                Incident incident = new Incident();
                incident.setTitle(incidentTitle);
                incident.setDescription("Automated incident escalated from critical telemetry alert: " + alert.getMessage());
                incident.setSeverity(Severity.CRITICAL);
                incident.setStatus(IncidentStatus.OPEN);
                incident.setAssignedTeam("SecOps Infrastructure");
                incidentService.createIncident(incident);
            }
        } catch (Exception e) {
            // Non-blocking fallback to preserve telemetry scheduler loop
            System.err.println("Incident escalation warning: " + e.getMessage());
        }
    }

    // =========================================================
    // AUTO-SCALING SIMULATION
    // =========================================================

    private void simulateAutoScaling(Long assetId) {
        System.out.println("AUTO-SCALING SIMULATION: Asset " + assetId + " requires additional capacity.");
    }

    // Getters and setters for configurable thresholds
    public double getCpuWarning() { return cpuWarning; }
    public void setCpuWarning(double cpuWarning) { this.cpuWarning = cpuWarning; }

    public double getCpuCritical() { return cpuCritical; }
    public void setCpuCritical(double cpuCritical) { this.cpuCritical = cpuCritical; }

    public double getMemoryWarning() { return memoryWarning; }
    public void setMemoryWarning(double memoryWarning) { this.memoryWarning = memoryWarning; }

    public double getMemoryCritical() { return memoryCritical; }
    public void setMemoryCritical(double memoryCritical) { this.memoryCritical = memoryCritical; }

    public double getDiskWarning() { return diskWarning; }
    public void setDiskWarning(double diskWarning) { this.diskWarning = diskWarning; }

    public double getDiskCritical() { return diskCritical; }
    public void setDiskCritical(double diskCritical) { this.diskCritical = diskCritical; }

    public double getNetworkLatencyWarning() { return networkLatencyWarning; }
    public void setNetworkLatencyWarning(double networkLatencyWarning) { this.networkLatencyWarning = networkLatencyWarning; }

    public double getNetworkLatencyCritical() { return networkLatencyCritical; }
    public void setNetworkLatencyCritical(double networkLatencyCritical) { this.networkLatencyCritical = networkLatencyCritical; }
}