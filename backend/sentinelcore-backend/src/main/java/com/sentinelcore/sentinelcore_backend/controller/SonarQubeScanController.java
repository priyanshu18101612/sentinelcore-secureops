package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.SonarQubeScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/scans")
public class SonarQubeScanController {

    private final SonarQubeScanService sonarQubeScanService;

    public SonarQubeScanController(SonarQubeScanService sonarQubeScanService) {
        this.sonarQubeScanService = sonarQubeScanService;
    }

    @PostMapping("/sonarqube")
    public ResponseEntity<?> uploadSonarQubeScan(@RequestParam(value = "file", required = false) MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or empty SonarQube report file"));
        }

        try {
            Map<String, Object> response = sonarQubeScanService.processSonarQubeReport(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process SonarQube report: " + e.getMessage()));
        }
    }
}
