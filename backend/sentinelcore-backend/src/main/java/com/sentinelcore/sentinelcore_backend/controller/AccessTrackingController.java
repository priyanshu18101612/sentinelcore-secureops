package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.AccessLog;
import com.sentinelcore.sentinelcore_backend.service.AccessTrackingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/access")
public class AccessTrackingController {

    private final AccessTrackingService accessTrackingService;

    public AccessTrackingController(AccessTrackingService accessTrackingService) {
        this.accessTrackingService = accessTrackingService;
    }

    @GetMapping("/tracking")
    public ResponseEntity<AccessTrackingService.AccessTrackingSummary> getAccessTracking() {
        return ResponseEntity.ok(accessTrackingService.getAccessTrackingSummary());
    }

    @PostMapping("/log-event")
    public ResponseEntity<AccessLog> logEvent(@RequestBody Map<String, String> body) {
        String username = body.getOrDefault("username", "anonymous");
        String ipAddress = body.getOrDefault("ipAddress", "127.0.0.1");
        String eventType = body.getOrDefault("eventType", "LOGIN_SUCCESS");
        String status = body.getOrDefault("status", "SUCCESS");
        String failureReason = body.get("failureReason");
        String userAgent = body.getOrDefault("userAgent", "SentinelCore-Client");

        AccessLog saved = accessTrackingService.logEvent(
                username,
                ipAddress,
                eventType,
                status,
                failureReason,
                userAgent
        );

        return ResponseEntity.ok(saved);
    }
}
