package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.DevSecOpsDashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/devsecops")
public class DevSecOpsDashboardController {

    private final DevSecOpsDashboardService devSecOpsDashboardService;

    public DevSecOpsDashboardController(DevSecOpsDashboardService devSecOpsDashboardService) {
        this.devSecOpsDashboardService = devSecOpsDashboardService;
    }

    @GetMapping("/posture")
    public ResponseEntity<DevSecOpsDashboardService.DevSecOpsPosture> getPosture() {
        return ResponseEntity.ok(devSecOpsDashboardService.getPosture());
    }
}
