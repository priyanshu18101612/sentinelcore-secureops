package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.ComplianceFrameworkService;
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

@WebMvcTest(ComplianceFrameworkController.class)
class ComplianceFrameworkControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ComplianceFrameworkService complianceFrameworkService;

    @Test
    void testGetFrameworks() throws Exception {
        ComplianceFrameworkService.OverallComplianceSummary summary = new ComplianceFrameworkService.OverallComplianceSummary(
                "COMPLIANT", 100.0, 3, 12, 12, 0, 0, LocalDateTime.now(), List.of()
        );
        when(complianceFrameworkService.getFrameworksSummary()).thenReturn(summary);

        mockMvc.perform(get("/api/compliance/frameworks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallStatus").value("COMPLIANT"))
                .andExpect(jsonPath("$.overallScore").value(100.0))
                .andExpect(jsonPath("$.totalFrameworks").value(3));
    }

    @Test
    void testEvaluateCompliance() throws Exception {
        ComplianceFrameworkService.OverallComplianceSummary summary = new ComplianceFrameworkService.OverallComplianceSummary(
                "COMPLIANT", 100.0, 3, 12, 12, 0, 0, LocalDateTime.now(), List.of()
        );
        when(complianceFrameworkService.evaluateAllFrameworks()).thenReturn(summary);

        mockMvc.perform(post("/api/compliance/evaluate"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.overallStatus").value("COMPLIANT"));
    }
}
