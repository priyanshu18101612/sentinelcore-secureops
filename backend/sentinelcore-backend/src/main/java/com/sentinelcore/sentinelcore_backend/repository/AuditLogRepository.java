package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByIncidentIdOrderByTimestampDesc(Long incidentId);

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findAllByOrderByIdAsc();

    Optional<AuditLog> findFirstByOrderByIdDesc();

    List<AuditLog> findByCategoryOrderByTimestampDesc(String category);

    List<AuditLog> findByEntityTypeOrderByTimestampDesc(String entityType);
}