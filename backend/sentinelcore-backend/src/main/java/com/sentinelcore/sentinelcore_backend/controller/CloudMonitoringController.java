package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.CloudResource;
import com.sentinelcore.sentinelcore_backend.service.CloudMonitoringService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/cloud")
public class CloudMonitoringController {

    private final CloudMonitoringService cloudMonitoringService;

    public CloudMonitoringController(CloudMonitoringService cloudMonitoringService) {
        this.cloudMonitoringService = cloudMonitoringService;
    }

    @GetMapping("/resources")
    public List<CloudResource> getResources() {
        return cloudMonitoringService.getAllResources();
    }

    @GetMapping("/health")
    public String getHealth() {
        return cloudMonitoringService.getCloudHealth();
    }
}