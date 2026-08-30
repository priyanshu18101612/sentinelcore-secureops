package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.NetworkMetric;
import com.sentinelcore.sentinelcore_backend.service.NetworkMonitoringService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/network")
public class NetworkMonitoringController {

    private final NetworkMonitoringService networkMonitoringService;

    public NetworkMonitoringController(NetworkMonitoringService networkMonitoringService) {
        this.networkMonitoringService = networkMonitoringService;
    }

    @GetMapping("/status")
    public String getStatus() {
        return networkMonitoringService.getNetworkStatus();
    }

    @GetMapping("/metrics")
    public List<NetworkMetric> getMetrics() {
        return networkMonitoringService.getNetworkMetrics();
    }
}