package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.TrivyScanService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/scans")
public class TrivyScanController {

    private final TrivyScanService trivyScanService;

    public TrivyScanController(TrivyScanService trivyScanService) {
        this.trivyScanService = trivyScanService;
    }

    @PostMapping("/trivy")
    public ResponseEntity<?> uploadTrivyScan(@RequestParam(value = "file", required = false) MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or empty Trivy report file"));
        }

        try {
            Map<String, Object> response = trivyScanService.processTrivyReport(file);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to process Trivy scan report: " + e.getMessage()));
        }
    }
}
