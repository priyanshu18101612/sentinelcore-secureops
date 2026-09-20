package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.CrossMilestoneCorrelationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CrossMilestoneCorrelationController.class)
class CrossMilestoneCorrelationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private CrossMilestoneCorrelationService correlationService;

    @Test
    void testGetHostCorrelationEndpoint() throws Exception {
        var readiness = new CrossMilestoneCorrelationService.UnifiedReadinessBreakdown(
                92.5, 90.0, 95.0, 93.0, "Proprietary SentinelCore Operational Readiness Index"
        );

        var response = new CrossMilestoneCorrelationService.HostCorrelationResponse(
                "LOCAL-WORKSTATION-HOST",
                "Windows 11",
                "10:00 hrs",
                "HEALTHY",
                Map.of("cpuUsagePercent", 15.0),
                Collections.emptyList(),
                Collections.emptyList(),
                Map.of("overallScore", 95.0),
                Map.of("status", "VERIFIED"),
                readiness,
                LocalDateTime.now()
        );

        when(correlationService.getHostCorrelation()).thenReturn(response);

        mockMvc.perform(get("/api/devsecops/host-correlation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hostName").value("LOCAL-WORKSTATION-HOST"))
                .andExpect(jsonPath("$.hostOperationalStatus").value("HEALTHY"))
                .andExpect(jsonPath("$.readinessScore.overallScore").value(92.5));
    }

    @Test
    void testRunFullSystemAuditSuccess() throws Exception {
        Map<String, Object> successMap = new LinkedHashMap<>();
        successMap.put("status", "SUCCESS");
        successMap.put("message", "Audit completed");
        successMap.put("executionDurationMs", 5000);

        when(correlationService.runFullSystemAudit(any())).thenReturn(successMap);

        mockMvc.perform(post("/api/devsecops/full-system-audit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"path\":\"C:\\\\test\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SUCCESS"))
                .andExpect(jsonPath("$.message").value("Audit completed"));
    }

    @Test
    void testRunFullSystemAuditConflictWhenAlreadyRunning() throws Exception {
        Map<String, Object> busyMap = new LinkedHashMap<>();
        busyMap.put("status", "ALREADY_RUNNING");
        busyMap.put("message", "A full system audit is currently in progress. Please wait for it to finish.");

        when(correlationService.runFullSystemAudit(any())).thenReturn(busyMap);

        mockMvc.perform(post("/api/devsecops/full-system-audit"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value("ALREADY_RUNNING"));
    }
}
