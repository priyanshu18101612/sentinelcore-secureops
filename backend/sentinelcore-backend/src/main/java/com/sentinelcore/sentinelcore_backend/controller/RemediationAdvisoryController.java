package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.RemediationAdvisoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/devsecops")
public class RemediationAdvisoryController {

    private final RemediationAdvisoryService advisoryService;

    public RemediationAdvisoryController(RemediationAdvisoryService advisoryService) {
        this.advisoryService = advisoryService;
    }

    @GetMapping("/remediation-advisories")
    public ResponseEntity<RemediationAdvisoryService.AdvisoryResponse> getAdvisories() {
        return ResponseEntity.ok(advisoryService.generateAdvisories());
    }
}
