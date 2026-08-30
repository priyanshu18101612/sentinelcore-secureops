package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AssetHealth;
import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.repository.InfrastructureMetricRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InfrastructureMonitoringService {

    private final InfrastructureMetricRepository metricRepository;

    public InfrastructureMonitoringService(
            InfrastructureMetricRepository metricRepository) {

        this.metricRepository = metricRepository;
    }

    // Get all metrics from PostgreSQL
    public List<InfrastructureMetric> getAllMetrics() {
        return metricRepository.findAll();
    }

    // Get metric by ID from PostgreSQL
    public InfrastructureMetric getMetricById(Long id) {
        return metricRepository.findById(id).orElse(null);
    }

    // Get metrics for a specific asset from PostgreSQL
    public List<InfrastructureMetric> getMetricsByAssetId(Long assetId) {
        return metricRepository.findByAssetId(assetId);
    }

    // Calculate asset health from database metrics
    public AssetHealth getAssetHealth(Long assetId) {

        List<InfrastructureMetric> assetMetrics =
                metricRepository.findByAssetId(assetId);

        if (assetMetrics.isEmpty()) {
            return null;
        }

        // Use the most recent metric
        InfrastructureMetric metric =
                assetMetrics.get(assetMetrics.size() - 1);

        String status = "HEALTHY";

        if (metric.getCpuUsage() > 80 ||
            metric.getMemoryUsage() > 85 ||
            metric.getDiskUsage() > 90) {

            status = "UNHEALTHY";
        }

        return new AssetHealth(
                assetId,
                status,
                metric.getTimestamp()
        );
    }
}