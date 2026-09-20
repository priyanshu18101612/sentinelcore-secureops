package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.SecurityReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SecurityReportRepository extends JpaRepository<SecurityReport, Long> {

    List<SecurityReport> findAllByOrderByGeneratedAtDesc();
}
