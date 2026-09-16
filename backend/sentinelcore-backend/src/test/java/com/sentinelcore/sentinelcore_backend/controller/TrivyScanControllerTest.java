package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.TrivyScanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TrivyScanController.class)
class TrivyScanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TrivyScanService trivyScanService;

    @Test
    void testUploadTrivyScanSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "trivy-results.json",
                "application/json",
                "{\"SchemaVersion\": 2}".getBytes()
        );

        when(trivyScanService.processTrivyReport(any())).thenReturn(Map.of(
                "message", "Trivy scan report processed successfully",
                "totalFindings", 3,
                "savedFindings", 3
        ));

        mockMvc.perform(multipart("/api/scans/trivy").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Trivy scan report processed successfully"))
                .andExpect(jsonPath("$.totalFindings").value(3))
                .andExpect(jsonPath("$.savedFindings").value(3));
    }

    @Test
    void testUploadTrivyScanEmptyFileReturns400() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.json",
                "application/json",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/scans/trivy").file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or empty Trivy report file"));
    }
}
