package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.CloudResource;
import com.sentinelcore.sentinelcore_backend.repository.CloudResourceRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CloudMonitoringService {

    private final CloudResourceRepository cloudResourceRepository;

    public CloudMonitoringService(
            CloudResourceRepository cloudResourceRepository) {

        this.cloudResourceRepository = cloudResourceRepository;
    }

    // Get all cloud resources from PostgreSQL
    public List<CloudResource> getAllResources() {
        return cloudResourceRepository.findAll();
    }

    // Calculate overall cloud health
    public String getCloudHealth() {

        List<CloudResource> resources =
                cloudResourceRepository.findAll();

        if (resources.isEmpty()) {
            return "HEALTHY";
        }

        boolean allHealthy = resources.stream()
                .allMatch(resource ->
                        "HEALTHY".equalsIgnoreCase(
                                resource.getStatus()
                        ));

        return allHealthy ? "HEALTHY" : "UNHEALTHY";
    }
}