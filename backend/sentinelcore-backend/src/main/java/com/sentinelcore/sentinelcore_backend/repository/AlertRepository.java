package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AlertRepository extends JpaRepository<Alert, Long> {

    List<Alert> findByAssetId(Long assetId);

    List<Alert> findByAssetIdAndAlertTypeAndSeverityAndStatus(
            Long assetId,
            String alertType,
            String severity,
            String status);

    List<Alert> findByStatus(String status);
}