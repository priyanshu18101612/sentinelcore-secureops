package com.sentinelcore.sentinelcore_backend.model;

public class SlaResponse {

    private int totalAssets;
    private int healthyAssets;
    private int unhealthyAssets;
    private double availability;
    private String status;

    public SlaResponse() {
    }

    public SlaResponse(
            int totalAssets,
            int healthyAssets,
            int unhealthyAssets,
            double availability,
            String status) {

        this.totalAssets = totalAssets;
        this.healthyAssets = healthyAssets;
        this.unhealthyAssets = unhealthyAssets;
        this.availability = availability;
        this.status = status;
    }

    public int getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(int totalAssets) {
        this.totalAssets = totalAssets;
    }

    public int getHealthyAssets() {
        return healthyAssets;
    }

    public void setHealthyAssets(int healthyAssets) {
        this.healthyAssets = healthyAssets;
    }

    public int getUnhealthyAssets() {
        return unhealthyAssets;
    }

    public void setUnhealthyAssets(int unhealthyAssets) {
        this.unhealthyAssets = unhealthyAssets;
    }

    public double getAvailability() {
        return availability;
    }

    public void setAvailability(double availability) {
        this.availability = availability;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}