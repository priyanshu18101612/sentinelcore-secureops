package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.service.InfrastructureMonitoringService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.sentinelcore.sentinelcore_backend.model.AssetHealth;

import java.util.List;

@RestController
@RequestMapping("/api/infrastructure")
public class InfrastructureMonitoringController {

    private final InfrastructureMonitoringService monitoringService;

    public InfrastructureMonitoringController(
            InfrastructureMonitoringService monitoringService) {
        this.monitoringService = monitoringService;
    }

    @GetMapping("/metrics")
    public List<InfrastructureMetric> getAllMetrics() {
        return monitoringService.getAllMetrics();
    }

    @GetMapping("/metrics/{id}")
    public ResponseEntity<InfrastructureMetric> getMetricById(
            @PathVariable Long id) {

        InfrastructureMetric metric =
                monitoringService.getMetricById(id);

        if (metric == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(metric);
    }

    @GetMapping("/assets/{assetId}/metrics")
    public List<InfrastructureMetric> getMetricsByAssetId(
            @PathVariable Long assetId) {

        return monitoringService.getMetricsByAssetId(assetId);
    }

    @GetMapping("/assets/{assetId}/health")
public ResponseEntity<AssetHealth> getAssetHealth(
        @PathVariable Long assetId) {

    AssetHealth health =
            monitoringService.getAssetHealth(assetId);

    if (health == null) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(health);
}
}