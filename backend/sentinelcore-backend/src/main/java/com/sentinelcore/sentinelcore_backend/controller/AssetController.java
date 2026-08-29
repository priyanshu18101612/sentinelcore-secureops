package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import com.sentinelcore.sentinelcore_backend.service.AssetService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
public class AssetController {

    private final AssetService assetService;

    public AssetController(AssetService assetService) {
        this.assetService = assetService;
    }

    @GetMapping
    public List<Asset> getAllAssets() {
        return assetService.getAllAssets();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Asset> getAssetById(@PathVariable Long id) {

        Asset asset = assetService.getAssetById(id);

        if (asset == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(asset);
    }

    @PostMapping
    public ResponseEntity<Asset> createAsset(@RequestBody Asset asset) {

    Asset createdAsset = assetService.createAsset(asset);

    return ResponseEntity.ok(createdAsset);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Asset> updateAsset(
        @PathVariable Long id,
        @RequestBody Asset asset) {

    Asset updatedAsset = assetService.updateAsset(id, asset);

    if (updatedAsset == null) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.ok(updatedAsset);
    }

    @DeleteMapping("/{id}")
     public ResponseEntity<Void> deleteAsset(@PathVariable Long id) {

    boolean deleted = assetService.deleteAsset(id);

    if (!deleted) {
        return ResponseEntity.notFound().build();
    }

    return ResponseEntity.noContent().build();
    }
}