package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.RemediationAdvisoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(RemediationAdvisoryController.class)
class RemediationAdvisoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RemediationAdvisoryService advisoryService;

    @Test
    void testGetRemediationAdvisories() throws Exception {
        var advisory = new RemediationAdvisoryService.RemediationAdvisory(
                "ADV-VULN-1",
                "VULN-1",
                "CVE-2026-65182",
                "Tomcat DoS",
                "CRITICAL",
                "Trivy",
                "tomcat-embed-core",
                "11.0.24",
                "11.0.25",
                "High severity DoS vulnerability",
                "Upgrade package to 11.0.25",
                75.0,
                82.0,
                7.0,
                "VULNERABILITY"
        );

        var response = new RemediationAdvisoryService.AdvisoryResponse(
                "LOCAL-WORKSTATION-HOST",
                75.0,
                15.0,
                1,
                List.of(advisory),
                "Informational remediation advisory only."
        );

        when(advisoryService.generateAdvisories()).thenReturn(response);

        mockMvc.perform(get("/api/devsecops/remediation-advisories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.monitoredHost").value("LOCAL-WORKSTATION-HOST"))
                .andExpect(jsonPath("$.currentReadinessScore").value(75.0))
                .andExpect(jsonPath("$.totalAdvisories").value(1))
                .andExpect(jsonPath("$.advisories[0].cveId").value("CVE-2026-65182"))
                .andExpect(jsonPath("$.advisories[0].fixedVersion").value("11.0.25"))
                .andExpect(jsonPath("$.advisories[0].projectedScoreDelta").value(7.0));
    }
}
