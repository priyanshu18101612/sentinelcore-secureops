package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.DevSecOpsDashboardService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(DevSecOpsDashboardController.class)
class DevSecOpsDashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private DevSecOpsDashboardService devSecOpsDashboardService;

    @Test
    void testGetPosture() throws Exception {
        DevSecOpsDashboardService.DevSecOpsPosture posture = new DevSecOpsDashboardService.DevSecOpsPosture(
                10, 2, 3, 3, 2, 4.5, 50, 40, 10, 80.0, 1, 1,
                new DevSecOpsDashboardService.ScannerMetrics("Trivy", 5, 1, 2, 1, 1, "OPERATIONAL", "Summary"),
                new DevSecOpsDashboardService.ScannerMetrics("SonarQube", 5, 1, 1, 2, 1, "OPERATIONAL", "Summary"),
                "COMPLIANT", 95.0, 11, 1
        );
        when(devSecOpsDashboardService.getPosture()).thenReturn(posture);

        mockMvc.perform(get("/api/devsecops/posture"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalVulnerabilities").value(10))
                .andExpect(jsonPath("$.criticalVulnerabilities").value(2))
                .andExpect(jsonPath("$.fleetRiskScore").value(4.5))
                .andExpect(jsonPath("$.trivyScanner.scannerName").value("Trivy"));
    }
}
