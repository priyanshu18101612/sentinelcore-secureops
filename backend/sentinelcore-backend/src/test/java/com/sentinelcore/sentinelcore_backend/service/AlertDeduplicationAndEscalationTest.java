package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Alert;
import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.InfrastructureMetric;
import com.sentinelcore.sentinelcore_backend.repository.AlertRepository;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlertDeduplicationAndEscalationTest {

    @Mock
    private AlertRepository alertRepository;

    @Mock
    private IncidentService incidentService;

    @Mock
    private IncidentRepository incidentRepository;

    private AlertService alertService;

    @BeforeEach
    void setUp() {
        alertService = new AlertService(alertRepository, incidentService, incidentRepository);
        alertService.setCpuWarning(90.0);
        alertService.setCpuCritical(95.0);
        alertService.setMemoryWarning(90.0);
        alertService.setMemoryCritical(95.0);
        alertService.setDiskWarning(85.0);
        alertService.setDiskCritical(92.0);
        alertService.setNetworkLatencyWarning(50.0);
        alertService.setNetworkLatencyCritical(100.0);
    }

    @Test
    void testConfigurableThresholdDefaults() {
        assertEquals(90.0, alertService.getCpuWarning());
        assertEquals(95.0, alertService.getCpuCritical());
        assertEquals(90.0, alertService.getMemoryWarning());
        assertEquals(95.0, alertService.getMemoryCritical());
        assertEquals(85.0, alertService.getDiskWarning());
        assertEquals(92.0, alertService.getDiskCritical());
        assertEquals(50.0, alertService.getNetworkLatencyWarning());
        assertEquals(100.0, alertService.getNetworkLatencyCritical());
    }

    @Test
    void testAlertCreationWhenNoActiveAlertExists() {
        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_CPU_USAGE"), eq("HIGH"), eq("OPEN")
        )).thenReturn(Collections.emptyList());

        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> {
            Alert a = invocation.getArgument(0);
            a.setId(101L);
            return a;
        });

        InfrastructureMetric metric = new InfrastructureMetric(
                1L, 4L, 91.5, 50.0, 40.0, 10.0, 10.0, LocalDateTime.now()
        );

        List<Alert> alerts = alertService.detectAnomalies(List.of(metric));

        assertEquals(1, alerts.size());
        assertEquals("HIGH", alerts.get(0).getSeverity());
        assertEquals("HIGH_CPU_USAGE", alerts.get(0).getAlertType());
        verify(alertRepository, times(1)).save(any(Alert.class));
        verify(incidentService, never()).createIncident(any(Incident.class));
    }

    @Test
    void testAlertDeduplicationOnRepeatedBreachReadings() {
        Alert existingAlert = new Alert(
                201L, 4L, "HIGH_CPU_USAGE", "HIGH", "Initial spike", "OPEN", LocalDateTime.now().toString(), null
        );

        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_CPU_USAGE"), eq("HIGH"), eq("OPEN")
        )).thenReturn(List.of(existingAlert));

        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        InfrastructureMetric metric = new InfrastructureMetric(
                2L, 4L, 92.0, 50.0, 40.0, 10.0, 10.0, LocalDateTime.now()
        );

        List<Alert> alerts = alertService.detectAnomalies(List.of(metric));

        assertEquals(1, alerts.size());
        assertEquals(201L, alerts.get(0).getId());
        assertTrue(alerts.get(0).getMessage().contains("92.00%"));
        // Does not create a second alert entity, simply updates existing
        verify(alertRepository, times(1)).save(existingAlert);
    }

    @Test
    void testCriticalAlertAutoEscalatesToIncidentWhenNoActiveIncidentExists() {
        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_CPU_USAGE"), eq("CRITICAL"), eq("OPEN")
        )).thenReturn(Collections.emptyList());

        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(incidentRepository.existsByTitleAndStatusIn(anyString(), anyCollection())).thenReturn(false);

        InfrastructureMetric metric = new InfrastructureMetric(
                3L, 4L, 96.5, 50.0, 40.0, 10.0, 10.0, LocalDateTime.now()
        );

        List<Alert> alerts = alertService.detectAnomalies(List.of(metric));

        assertEquals(1, alerts.size());
        assertEquals("CRITICAL", alerts.get(0).getSeverity());
        verify(incidentService, times(1)).createIncident(any(Incident.class));
    }

    @Test
    void testIncidentDeduplicationWhenIncidentIsAlreadyActive() {
        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_CPU_USAGE"), eq("CRITICAL"), eq("OPEN")
        )).thenReturn(Collections.emptyList());

        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        // Active incident already exists in OPEN, ASSIGNED, or INVESTIGATING
        when(incidentRepository.existsByTitleAndStatusIn(
                eq("[CRITICAL] HIGH_CPU_USAGE on Asset #4"),
                anyCollection()
        )).thenReturn(true);

        InfrastructureMetric metric = new InfrastructureMetric(
                4L, 4L, 97.0, 50.0, 40.0, 10.0, 10.0, LocalDateTime.now()
        );

        alertService.detectAnomalies(List.of(metric));

        // Incident creation must NOT be called because an active incident already exists
        verify(incidentService, never()).createIncident(any(Incident.class));
    }

    @Test
    void testNetworkLatencyAnomalyDetection() {
        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_NETWORK_LATENCY"), eq("HIGH"), eq("OPEN")
        )).thenReturn(Collections.emptyList());
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));

        List<Alert> alerts = alertService.detectNetworkAnomalies(4L, 65.0, 0.0);

        assertEquals(1, alerts.size());
        assertEquals("HIGH_NETWORK_LATENCY", alerts.get(0).getAlertType());
        assertEquals("HIGH", alerts.get(0).getSeverity());
    }

    @Test
    void testNetworkLatencyAnomalyDetectionWithNullLatencyReturnsEmptyList() {
        List<Alert> alerts = alertService.detectNetworkAnomalies(4L, null, 0.0);
        assertTrue(alerts.isEmpty());
        verify(alertRepository, never()).save(any(Alert.class));
    }

    @Test
    void testNetworkLatencyAnomalyDetectionCriticalLatencyAutoEscalates() {
        when(alertRepository.findByAssetIdAndAlertTypeAndSeverityAndStatus(
                eq(4L), eq("HIGH_NETWORK_LATENCY"), eq("CRITICAL"), eq("OPEN")
        )).thenReturn(Collections.emptyList());
        when(alertRepository.save(any(Alert.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(incidentRepository.existsByTitleAndStatusIn(anyString(), anyCollection())).thenReturn(false);

        List<Alert> alerts = alertService.detectNetworkAnomalies(4L, 125.0, 0.0);

        assertEquals(1, alerts.size());
        assertEquals("CRITICAL", alerts.get(0).getSeverity());
        assertEquals("HIGH_NETWORK_LATENCY", alerts.get(0).getAlertType());
        verify(incidentService, times(1)).createIncident(any(Incident.class));
    }
}
