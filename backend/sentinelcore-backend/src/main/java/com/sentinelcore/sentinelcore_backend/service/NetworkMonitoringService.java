package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.NetworkMetric;
import com.sentinelcore.sentinelcore_backend.repository.NetworkMetricRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NetworkMonitoringService {

    private final NetworkMetricRepository networkMetricRepository;

    public NetworkMonitoringService(
            NetworkMetricRepository networkMetricRepository) {

        this.networkMetricRepository = networkMetricRepository;
    }

    // Get network metrics from PostgreSQL
    public List<NetworkMetric> getNetworkMetrics() {
        return networkMetricRepository.findAll();
    }

    // Calculate overall network status
    public String getNetworkStatus() {

        List<NetworkMetric> metrics =
                networkMetricRepository.findAll();

        if (metrics.isEmpty()) {
            return "UP";
        }

        return metrics.stream()
                .allMatch(metric ->
                        "UP".equalsIgnoreCase(
                                metric.getStatus()
                        ))
                ? "UP"
                : "DOWN";
    }
}