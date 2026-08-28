package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AlertService {

    private final List<Alert> alerts = new ArrayList<>();

    public AlertService() {
        alerts.add(new Alert(
                1L,
                1L,
                "HIGH_CPU_USAGE",
                "HIGH",
                "CPU usage exceeded the threshold",
                "OPEN",
                "2026-08-25T10:30:00",
                null
        ));
    }

    public List<Alert> getAllAlerts() {
        return alerts;
    }

    public Alert getAlertById(Long id) {
        return alerts.stream()
                .filter(alert -> alert.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public Alert createAlert(Alert alert) {
        long newId = alerts.size() + 1L;
        alert.setId(newId);
        alert.setStatus("OPEN");
        alerts.add(alert);
        return alert;
    }

    public Alert acknowledgeAlert(Long id) {
        Alert alert = getAlertById(id);

        if (alert != null) {
            alert.setStatus("ACKNOWLEDGED");
            alert.setAcknowledgedAt("2026-08-28T21:00:00");
        }

        return alert;
    }
}