package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.AccessLog;
import com.sentinelcore.sentinelcore_backend.repository.AccessLogRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccessTrackingServiceTest {

    @Mock
    private AccessLogRepository accessLogRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private AccessTrackingService accessTrackingService;

    @Test
    void testLogEventSavesAndAudits() {
        when(accessLogRepository.save(any(AccessLog.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AccessLog log = accessTrackingService.logEvent(
                "alex.vance@sentinelcore.io",
                "192.168.1.50",
                "LOGIN_SUCCESS",
                "SUCCESS",
                null,
                "Mozilla/5.0"
        );

        assertNotNull(log);
        assertEquals("alex.vance@sentinelcore.io", log.getUsername());
        assertEquals("LOGIN_SUCCESS", log.getEventType());
        verify(accessLogRepository, times(1)).save(any(AccessLog.class));
        verify(auditLogService, times(1)).logAction(any(), eq("AUTH"), eq("alex.vance@sentinelcore.io"), eq("ACCESS_CONTROL"), any(), any(), any(), any());
    }

    @Test
    void testGetAccessTrackingSummary() {
        when(accessLogRepository.count()).thenReturn(100L);
        when(accessLogRepository.countByEventType("LOGIN_SUCCESS")).thenReturn(90L);
        when(accessLogRepository.countByEventType("LOGIN_FAILURE")).thenReturn(5L);
        when(accessLogRepository.countByEventType("LOGOUT")).thenReturn(4L);
        when(accessLogRepository.countByEventType("PRIVILEGE_ELEVATION")).thenReturn(1L);
        when(accessLogRepository.findAllByOrderByTimestampDesc()).thenReturn(List.of());

        AccessTrackingService.AccessTrackingSummary summary = accessTrackingService.getAccessTrackingSummary();

        assertNotNull(summary);
        assertEquals(100L, summary.totalEvents());
        assertEquals(90L, summary.successfulLogins());
        assertEquals(5L, summary.failedLogins());
    }
}
