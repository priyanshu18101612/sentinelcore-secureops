package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.NetworkMetric;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class NetworkMonitoringService {

    private final List<NetworkMetric> metrics = new ArrayList<>();

    public NetworkMonitoringService() {
        metrics.add(new NetworkMetric(
                1L,
                "Main-Network",
                "UP",
                120.4,
                85.6,
                12.5,
                0.2,
                "2026-08-25T10:30:00"
        ));
    }

    public List<NetworkMetric> getNetworkMetrics() {
        return metrics;
    }

    public String getNetworkStatus() {
        return metrics.stream()
                .allMatch(metric -> "UP".equalsIgnoreCase(metric.getStatus()))
                ? "UP"
                : "DOWN";
    }
}