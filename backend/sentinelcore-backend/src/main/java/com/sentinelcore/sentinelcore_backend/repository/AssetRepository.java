package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.Asset;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssetRepository extends JpaRepository<Asset, Long> {
}
