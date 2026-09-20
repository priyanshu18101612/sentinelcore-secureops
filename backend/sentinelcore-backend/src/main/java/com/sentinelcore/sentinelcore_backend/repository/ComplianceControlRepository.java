package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.ComplianceControl;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ComplianceControlRepository extends JpaRepository<ComplianceControl, Long> {

    List<ComplianceControl> findByFrameworkOrderByControlIdAsc(String framework);

    List<ComplianceControl> findAllByOrderByFrameworkAscControlIdAsc();

    Optional<ComplianceControl> findByFrameworkAndControlId(String framework, String controlId);

    long countByFrameworkAndStatus(String framework, String status);

    long countByFramework(String framework);
}
