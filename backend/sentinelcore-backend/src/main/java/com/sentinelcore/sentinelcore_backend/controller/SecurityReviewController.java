package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.SecurityReview;
import com.sentinelcore.sentinelcore_backend.service.SecurityReviewService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/security-reviews")
public class SecurityReviewController {

    private final SecurityReviewService securityReviewService;

    public SecurityReviewController(SecurityReviewService securityReviewService) {
        this.securityReviewService = securityReviewService;
    }

    @GetMapping("/current")
    public ResponseEntity<SecurityReview> getCurrentReview() {
        return ResponseEntity.ok(securityReviewService.getCurrentReview());
    }

    @PostMapping("/sign-off")
    public ResponseEntity<SecurityReview> signOff(@RequestBody(required = false) Map<String, String> body) {
        String reviewerName = body != null ? body.get("reviewerName") : null;
        String reviewerRole = body != null ? body.get("reviewerRole") : null;
        String notes = body != null ? body.get("notes") : null;

        SecurityReview approved = securityReviewService.signOffReview(reviewerName, reviewerRole, notes);
        return ResponseEntity.ok(approved);
    }
}
