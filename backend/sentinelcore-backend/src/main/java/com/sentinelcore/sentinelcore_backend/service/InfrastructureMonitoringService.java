package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import org.springframework.stereotype.Service;
import com.sentinelcore.sentinelcore_backend.model.AssetHealth;

import java.util.ArrayList;
import java.util.List;

@Service
public class InfrastructureMonitoringService {

    private final List<InfrastructureMetric> metrics = new ArrayList<>();

    public InfrastructureMonitoringService() {

        metrics.add(new InfrastructureMetric(
                1L,
                1L,
                45.50,
                62.30,
                71.20,
                120.50,
                95.40,
                "2026-08-30T10:30:00"
        ));

        metrics.add(new InfrastructureMetric(
                2L,
                2L,
                32.80,
                48.60,
                55.10,
                85.20,
                70.30,
                "2026-08-30T10:30:00"
        ));
    }

    public List<InfrastructureMetric> getAllMetrics() {
        return metrics;
    }

    public InfrastructureMetric getMetricById(Long id) {
        return metrics.stream()
                .filter(metric -> metric.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public List<InfrastructureMetric> getMetricsByAssetId(Long assetId) {
        return metrics.stream()
                .filter(metric -> metric.getAssetId().equals(assetId))
                .toList();
    }

    public AssetHealth getAssetHealth(Long assetId) {

    InfrastructureMetric metric = metrics.stream()
            .filter(m -> m.getAssetId().equals(assetId))
            .findFirst()
            .orElse(null);

    if (metric == null) {
        return null;
    }

    String status = "HEALTHY";

    if (metric.getCpuUsage() > 80 ||
        metric.getMemoryUsage() > 85 ||
        metric.getDiskUsage() > 90) {

        status = "UNHEALTHY";
    }

    return new AssetHealth(
            assetId,
            status,
            "2026-08-30T10:30:00"
    );
    }
}