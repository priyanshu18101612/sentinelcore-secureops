package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import com.sentinelcore.sentinelcore_backend.repository.AssetRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AssetService {

    private final AssetRepository assetRepository;

    public AssetService(AssetRepository assetRepository) {
        this.assetRepository = assetRepository;
    }

    // Get all assets from PostgreSQL
    public List<Asset> getAllAssets() {
        List<Asset> assets = assetRepository.findAll();

        // Status is currently not stored in the database.
        // Set a default value for the frontend.
        for (Asset asset : assets) {
            if (asset.getStatus() == null) {
                asset.setStatus("HEALTHY");
            }
        }

        return assets;
    }

    // Get asset by ID from PostgreSQL
    public Asset getAssetById(Long id) {

        Asset asset = assetRepository.findById(id).orElse(null);

        if (asset != null && asset.getStatus() == null) {
            asset.setStatus("HEALTHY");
        }

        return asset;
    }

    // Create asset in PostgreSQL
    public Asset createAsset(Asset asset) {

        if (asset.getStatus() == null) {
            asset.setStatus("HEALTHY");
        }

        return assetRepository.save(asset);
    }

    // Update asset in PostgreSQL
    public Asset updateAsset(Long id, Asset updatedAsset) {

        Asset existingAsset = assetRepository.findById(id).orElse(null);

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

        return assetRepository.save(existingAsset);
    }

    // Delete asset from PostgreSQL
    public boolean deleteAsset(Long id) {

        if (!assetRepository.existsById(id)) {
            return false;
        }

        assetRepository.deleteById(id);

        return true;
    }
}