package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import com.sentinelcore.sentinelcore_backend.service.AlertService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
public class AlertController {

    private final AlertService alertService;

    public AlertController(AlertService alertService) {
        this.alertService = alertService;
    }

    @GetMapping
    public List<Alert> getAllAlerts() {
        return alertService.getAllAlerts();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Alert> getAlertById(@PathVariable Long id) {
        Alert alert = alertService.getAlertById(id);

        if (alert == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(alert);
    }

    @PostMapping
    public ResponseEntity<Alert> createAlert(@RequestBody Alert alert) {
        return ResponseEntity.ok(alertService.createAlert(alert));
    }

    @PutMapping("/{id}/acknowledge")
    public ResponseEntity<Alert> acknowledgeAlert(@PathVariable Long id) {
        Alert alert = alertService.acknowledgeAlert(id);

        if (alert == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(alert);
    }
}