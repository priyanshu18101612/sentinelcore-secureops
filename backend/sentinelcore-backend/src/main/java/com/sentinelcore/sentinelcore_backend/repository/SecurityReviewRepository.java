package com.sentinelcore.sentinelcore_backend.repository;

import com.sentinelcore.sentinelcore_backend.model.SecurityReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SecurityReviewRepository extends JpaRepository<SecurityReview, Long> {

    Optional<SecurityReview> findFirstByOrderByStartDateDesc();

    List<SecurityReview> findAllByOrderByStartDateDesc();
}
