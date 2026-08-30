package com.sentinelcore.sentinelcore_backend.model;

public class AssetHealth {

    private Long assetId;
    private String status;
    private String checkedAt;

    public AssetHealth() {
    }

    public AssetHealth(Long assetId, String status, String checkedAt) {
        this.assetId = assetId;
        this.status = status;
        this.checkedAt = checkedAt;
    }

    public Long getAssetId() {
        return assetId;
    }

    public void setAssetId(Long assetId) {
        this.assetId = assetId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCheckedAt() {
        return checkedAt;
    }

    public void setCheckedAt(String checkedAt) {
        this.checkedAt = checkedAt;
    }
}