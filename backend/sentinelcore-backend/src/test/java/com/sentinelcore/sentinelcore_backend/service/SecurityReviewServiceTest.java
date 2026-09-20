package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.SecurityReview;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import com.sentinelcore.sentinelcore_backend.repository.SecurityReviewRepository;
import com.sentinelcore.sentinelcore_backend.repository.VulnerabilityRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SecurityReviewServiceTest {

    @Mock
    private SecurityReviewRepository securityReviewRepository;

    @Mock
    private VulnerabilityRepository vulnerabilityRepository;

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private AccessLogRepository accessLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private SecurityReviewService securityReviewService;

    @Test
    void testGetCurrentReviewExisting() {
        SecurityReview existing = new SecurityReview("Last 30 Days", LocalDateTime.now().minusDays(30), LocalDateTime.now(), "APPROVED", 0, "Alex Vance", "Lead SecOps Engineer", "Notes", LocalDateTime.now());
        when(securityReviewRepository.findFirstByOrderByStartDateDesc()).thenReturn(Optional.of(existing));

        SecurityReview result = securityReviewService.getCurrentReview();

        assertEquals("APPROVED", result.getStatus());
        assertEquals("Alex Vance", result.getReviewerName());
    }

    @Test
    void testSignOffReview() {
        SecurityReview pending = new SecurityReview("Last 30 Days", LocalDateTime.now().minusDays(30), LocalDateTime.now(), "PENDING", 0, null, null, null, null);
        when(securityReviewRepository.findFirstByOrderByStartDateDesc()).thenReturn(Optional.of(pending));
        when(securityReviewRepository.save(any(SecurityReview.class))).thenAnswer(invocation -> invocation.getArgument(0));

        SecurityReview signed = securityReviewService.signOffReview("Alex Vance", "Lead SecOps", "All checks passed.");

        assertEquals("APPROVED", signed.getStatus());
        assertEquals("Alex Vance", signed.getReviewerName());
        assertNotNull(signed.getSignedAt());
        verify(auditLogService, times(1)).logAction(any(), eq("SECURITY_REVIEW"), any(), eq("SECURITY_GOVERNANCE"), eq("SECURITY_REVIEW_APPROVED"), any(), any(), any());
    }
}
