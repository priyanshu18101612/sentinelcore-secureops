package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InfrastructureMetricRepository
        extends JpaRepository<InfrastructureMetric, Long> {

    List<InfrastructureMetric> findByAssetId(Long assetId);
}