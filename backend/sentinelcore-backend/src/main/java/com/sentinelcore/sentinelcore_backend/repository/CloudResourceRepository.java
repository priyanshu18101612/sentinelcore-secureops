package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.CloudResource;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CloudResourceRepository extends JpaRepository<CloudResource, Long> {
}
