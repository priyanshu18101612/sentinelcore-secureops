package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import com.sentinelcore.sentinelcore_backend.model.SlaResponse;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class SlaService {

    private final AssetService assetService;

    public SlaService(AssetService assetService) {
        this.assetService = assetService;
    }

    public SlaResponse calculateSla() {

        List<Asset> assets = assetService.getAllAssets();

        int totalAssets = assets.size();
        int healthyAssets = (int) assets.stream()
                .filter(asset ->
                        "HEALTHY".equalsIgnoreCase(asset.getStatus()))
                .count();

        int unhealthyAssets = totalAssets - healthyAssets;

        double availability = 0.0;

        if (totalAssets > 0) {
            availability =
                    ((double) healthyAssets / totalAssets) * 100;
        }

        String status;

        if (availability >= 99.0) {
            status = "EXCELLENT";
        } else if (availability >= 95.0) {
            status = "GOOD";
        } else if (availability >= 90.0) {
            status = "WARNING";
        } else {
            status = "CRITICAL";
        }

        return new SlaResponse(
                totalAssets,
                healthyAssets,
                unhealthyAssets,
                availability,
                status
        );
    }
}