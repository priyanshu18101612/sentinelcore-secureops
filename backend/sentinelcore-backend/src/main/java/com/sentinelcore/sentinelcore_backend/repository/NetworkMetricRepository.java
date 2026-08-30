package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.NetworkMetric;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NetworkMetricRepository extends JpaRepository<NetworkMetric, Long> {
}
