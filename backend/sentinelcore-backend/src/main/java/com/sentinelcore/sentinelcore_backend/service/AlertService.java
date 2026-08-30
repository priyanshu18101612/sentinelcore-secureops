package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.repository.AlertRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    private final AlertRepository alertRepository;

    // Monitoring thresholds
    private static final double CPU_WARNING = 70.0;
    private static final double CPU_HIGH = 80.0;
    private static final double CPU_CRITICAL = 90.0;

    private static final double MEMORY_WARNING = 75.0;
    private static final double MEMORY_HIGH = 85.0;
    private static final double MEMORY_CRITICAL = 95.0;

    private static final double DISK_WARNING = 80.0;
    private static final double DISK_HIGH = 90.0;
    private static final double DISK_CRITICAL = 95.0;

    public AlertService(AlertRepository alertRepository) {
        this.alertRepository = alertRepository;
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

        alert.setStatus("OPEN");

        if (alert.getCreatedAt() == null) {
            alert.setCreatedAt(LocalDateTime.now().toString());
        }

        // Let PostgreSQL generate the ID
        alert.setId(null);

        return alertRepository.save(alert);
    }

    // Acknowledge an alert
    public Alert acknowledgeAlert(Long id) {

        Alert alert = getAlertById(id);

        if (alert != null) {

            alert.setStatus("ACKNOWLEDGED");

            alert.setAcknowledgedAt(
                    LocalDateTime.now().toString()
            );

            return alertRepository.save(alert);
        }

        return null;
    }

    // =========================================================
    // ANOMALY DETECTION + AUTOMATIC ALERT GENERATION
    // =========================================================

    public List<Alert> detectAnomalies(
            List<InfrastructureMetric> metrics) {

        List<Alert> generatedAlerts = new ArrayList<>();

        for (InfrastructureMetric metric : metrics) {

            // CPU anomaly
            if (metric.getCpuUsage() >= CPU_WARNING) {

                String severity = calculateSeverity(
                        metric.getCpuUsage(),
                        CPU_HIGH,
                        CPU_CRITICAL
                );

                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_CPU_USAGE",
                        severity,
                        "CPU usage reached "
                                + metric.getCpuUsage()
                                + "%"
                );

                generatedAlerts.add(alert);

                // Auto-scaling simulation for critical CPU
                if (metric.getCpuUsage() >= CPU_CRITICAL) {
                    simulateAutoScaling(metric.getAssetId());
                }
            }

            // Memory anomaly
            if (metric.getMemoryUsage() >= MEMORY_WARNING) {

                String severity = calculateSeverity(
                        metric.getMemoryUsage(),
                        MEMORY_HIGH,
                        MEMORY_CRITICAL
                );

                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_MEMORY_USAGE",
                        severity,
                        "Memory usage reached "
                                + metric.getMemoryUsage()
                                + "%"
                );

                generatedAlerts.add(alert);
            }

            // Disk anomaly
            if (metric.getDiskUsage() >= DISK_WARNING) {

                String severity = calculateSeverity(
                        metric.getDiskUsage(),
                        DISK_HIGH,
                        DISK_CRITICAL
                );

                Alert alert = createMonitoringAlert(
                        metric.getAssetId(),
                        "HIGH_DISK_USAGE",
                        severity,
                        "Disk usage reached "
                                + metric.getDiskUsage()
                                + "%"
                );

                generatedAlerts.add(alert);
            }
        }

        return generatedAlerts;
    }

    // =========================================================
    // SEVERITY CALCULATION
    // =========================================================

    private String calculateSeverity(
            double value,
            double highThreshold,
            double criticalThreshold) {

        if (value >= criticalThreshold) {
            return "CRITICAL";
        }

        if (value >= highThreshold) {
            return "HIGH";
        }

        return "MEDIUM";
    }

    // =========================================================
    // CREATE MONITORING ALERT
    // =========================================================

    private Alert createMonitoringAlert(
            Long assetId,
            String alertType,
            String severity,
            String message) {

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

        return createAlert(alert);
    }

    // =========================================================
    // AUTO-SCALING SIMULATION
    // =========================================================

    private void simulateAutoScaling(Long assetId) {

        System.out.println(
                "AUTO-SCALING SIMULATION: "
                        + "Asset "
                        + assetId
                        + " requires additional capacity."
        );
    }
}