package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.SecurityReport;
import com.sentinelcore.sentinelcore_backend.service.ReportGenerationService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ReportGenerationController.class)
class ReportGenerationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ReportGenerationService reportGenerationService;

    @Test
    void testVerifyAttestationEndpoint() throws Exception {
        var verifyResult = new ReportGenerationService.AttestationVerificationResult(
                10L,
                "DEVSECOPS_EXECUTIVE_ATTESTATION",
                "INTEGRITY_VERIFIED",
                false,
                "abc123digest",
                "abc123digest",
                true,
                99L,
                "hash99",
                LocalDateTime.now().toString(),
                "Tamper-evident cryptographic integrity verified."
        );

        when(reportGenerationService.verifyAttestation(10L)).thenReturn(verifyResult);

        mockMvc.perform(post("/api/reports/10/verify-attestation"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.reportId").value(10))
                .andExpect(jsonPath("$.status").value("INTEGRITY_VERIFIED"))
                .andExpect(jsonPath("$.isTampered").value(false))
                .andExpect(jsonPath("$.auditLogChainBacked").value(true));
    }

    @Test
    void testGetAttestationBundleEndpoint() throws Exception {
        SecurityReport report = new SecurityReport(
                "DEVSECOPS_EXECUTIVE_ATTESTATION",
                "Executive Brief",
                "SecOps",
                LocalDateTime.now(),
                "{\"title\":\"Executive Brief\",\"tamperEvidentIntegrityDigest\":\"hash\"}",
                "READY"
        );
        ReflectionTestUtils.setField(report, "id", 10L);

        when(reportGenerationService.getReportById(10L)).thenReturn(Optional.of(report));

        mockMvc.perform(get("/api/reports/10/attestation-bundle"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", "attachment; filename=\"sentinelcore-attestation-10.json\""))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON));
    }
}
