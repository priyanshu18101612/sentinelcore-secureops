package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.SonarQubeScanService;
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

@WebMvcTest(SonarQubeScanController.class)
class SonarQubeScanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private SonarQubeScanService sonarQubeScanService;

    @Test
    void testUploadSonarQubeScanSuccess() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "sonarqube-issues.json",
                "application/json",
                "{\"issues\": []}".getBytes()
        );

        when(sonarQubeScanService.processSonarQubeReport(any())).thenReturn(Map.of(
                "message", "SonarQube scan report processed successfully",
                "totalFindings", 5,
                "savedFindings", 5
        ));

        mockMvc.perform(multipart("/api/scans/sonarqube").file(file))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("SonarQube scan report processed successfully"))
                .andExpect(jsonPath("$.totalFindings").value(5))
                .andExpect(jsonPath("$.savedFindings").value(5));
    }

    @Test
    void testUploadSonarQubeScanEmptyFileReturns400() throws Exception {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file",
                "empty.json",
                "application/json",
                new byte[0]
        );

        mockMvc.perform(multipart("/api/scans/sonarqube").file(emptyFile))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error").value("Invalid or empty SonarQube report file"));
    }
}
