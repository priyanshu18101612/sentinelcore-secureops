package com.sentinelcore.sentinelcore_backend.model;

public class Asset {

    private Long id;
    private String name;
    private String type;
    private String ipAddress;
    private String location;
    private String status;

    public Asset() {
    }

    public Asset(Long id, String name, String type,
                 String ipAddress, String location, String status) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.ipAddress = ipAddress;
        this.location = location;
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

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}