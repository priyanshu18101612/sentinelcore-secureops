package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.CloudResource;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class CloudMonitoringService {

    private final List<CloudResource> resources = new ArrayList<>();

    public CloudMonitoringService() {
        resources.add(new CloudResource(
                1L,
                "EC2-Server-01",
                "VIRTUAL_MACHINE",
                "AWS",
                "ap-south-1",
                "HEALTHY"
        ));

        resources.add(new CloudResource(
                2L,
                "Storage-01",
                "STORAGE",
                "AWS",
                "ap-south-1",
                "HEALTHY"
        ));
    }

    public List<CloudResource> getAllResources() {
        return resources;
    }

    public String getCloudHealth() {
        boolean allHealthy = resources.stream()
                .allMatch(resource -> "HEALTHY".equalsIgnoreCase(resource.getStatus()));

        return allHealthy ? "HEALTHY" : "UNHEALTHY";
    }
}