package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.AuditLog;
import com.sentinelcore.sentinelcore_backend.service.AuditLogService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuditLogController.class)
class AuditLogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AuditLogService auditLogService;

    @Test
    void testGetAuditLogs() throws Exception {
        AuditLog log = new AuditLog(1L, "INCIDENT", "1", "SECURITY_EVENT", "STATUS_CHANGE", "Alex Vance", "WebUI", LocalDateTime.now(), "Investigating", "prev123", "hash123");
        when(auditLogService.getAllAuditLogs(null, null, null)).thenReturn(List.of(log));

        mockMvc.perform(get("/api/audit/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].action").value("STATUS_CHANGE"))
                .andExpect(jsonPath("$[0].actor").value("Alex Vance"))
                .andExpect(jsonPath("$[0].hash").value("hash123"));
    }

    @Test
    void testVerifyChain() throws Exception {
        AuditLogService.ChainVerificationResult res = new AuditLogService.ChainVerificationResult(
                "VERIFIED", 10, false, "Chain intact", LocalDateTime.now()
        );
        when(auditLogService.verifyChainIntegrity()).thenReturn(res);

        mockMvc.perform(post("/api/audit/verify-chain"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("VERIFIED"))
                .andExpect(jsonPath("$.totalRecords").value(10))
                .andExpect(jsonPath("$.tamperDetected").value(false));
    }

    @Test
    void testGetStats() throws Exception {
        AuditLogService.AuditStats stats = new AuditLogService.AuditStats(
                10L, 7, true, "VERIFIED", false, LocalDateTime.now()
        );
        when(auditLogService.getAuditStats()).thenReturn(stats);

        mockMvc.perform(get("/api/audit/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalLogs").value(10))
                .andExpect(jsonPath("$.retentionYears").value(7))
                .andExpect(jsonPath("$.encrypted").value(true));
    }
}
