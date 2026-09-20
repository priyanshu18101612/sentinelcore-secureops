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
    private final com.sentinelcore.sentinelcore_backend.service.LocalScanRunnerService localScanRunnerService;

    public TrivyScanController(
            TrivyScanService trivyScanService,
            com.sentinelcore.sentinelcore_backend.service.LocalScanRunnerService localScanRunnerService) {
        this.trivyScanService = trivyScanService;
        this.localScanRunnerService = localScanRunnerService;
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

    @PostMapping("/trivy/run-local")
    public ResponseEntity<?> runLocalTrivyScan(@RequestBody(required = false) Map<String, String> request) {
        String targetPath = (request != null && request.containsKey("path")) ? request.get("path") : null;
        Map<String, Object> response = localScanRunnerService.runLocalTrivyScan(targetPath);
        if ("ERROR".equals(response.get("status"))) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/trivy/status")
    public ResponseEntity<?> getTrivyStatus() {
        return ResponseEntity.ok(localScanRunnerService.getTrivyStatus());
    }
}
