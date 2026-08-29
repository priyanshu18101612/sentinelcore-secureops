package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AssetService {

    private final List<Asset> assets = new ArrayList<>();

    public AssetService() {
        assets.add(new Asset(
                1L,
                "EC2-Server-01",
                "VIRTUAL_MACHINE",
                "10.0.1.10",
                "AWS Mumbai",
                "HEALTHY"
        ));

        assets.add(new Asset(
                2L,
                "Storage-01",
                "STORAGE",
                "10.0.1.20",
                "AWS Mumbai",
                "HEALTHY"
        ));
    }

    public List<Asset> getAllAssets() {
        return assets;
    }

    public Asset getAssetById(Long id) {
        return assets.stream()
                .filter(asset -> asset.getId().equals(id))
                .findFirst()
                .orElse(null);
    }

    public Asset createAsset(Asset asset) {

    long newId = assets.stream()
            .mapToLong(Asset::getId)
            .max()
            .orElse(0L) + 1;

    asset.setId(newId);

    if (asset.getStatus() == null) {
        asset.setStatus("HEALTHY");
    }

    assets.add(asset);

    return asset;
    }

    public Asset updateAsset(Long id, Asset updatedAsset) {

    Asset existingAsset = getAssetById(id);

    if (existingAsset == null) {
        return null;
    }

    existingAsset.setName(updatedAsset.getName());
    existingAsset.setType(updatedAsset.getType());
    existingAsset.setIpAddress(updatedAsset.getIpAddress());
    existingAsset.setLocation(updatedAsset.getLocation());

    if (updatedAsset.getStatus() != null) {
        existingAsset.setStatus(updatedAsset.getStatus());
    }

    return existingAsset;
    }

    public boolean deleteAsset(Long id) {

    Asset asset = getAssetById(id);

    if (asset == null) {
        return false;
    }

    assets.remove(asset);
    return true;
    }
}