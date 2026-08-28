package com.sentinelcore.sentinelcore_backend.model;

public class CloudResource {

    private Long id;
    private String name;
    private String resourceType;
    private String provider;
    private String region;
    private String status;

    public CloudResource() {
    }

    public CloudResource(Long id, String name, String resourceType,
                         String provider, String region, String status) {
        this.id = id;
        this.name = name;
        this.resourceType = resourceType;
        this.provider = provider;
        this.region = region;
        this.status = status;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getResourceType() {
        return resourceType;
    }

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getRegion() {
        return region;
    }

    public void setRegion(String region) {
        this.region = region;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
