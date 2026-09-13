package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.Playbook;
import com.sentinelcore.sentinelcore_backend.service.PlaybookExecutionService;
import com.sentinelcore.sentinelcore_backend.service.PlaybookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookExecutionController {

    private final PlaybookService playbookService;
    private final PlaybookExecutionService executionService;

    public PlaybookExecutionController(
            PlaybookService playbookService,
            PlaybookExecutionService executionService) {
        this.playbookService = playbookService;
        this.executionService = executionService;
    }

    @PostMapping("/{id}/execute")
    public ResponseEntity<String> executePlaybook(@PathVariable Long id) {

        Playbook playbook = playbookService.getPlaybookById(id)
                .orElse(null);

        if (playbook == null) {
            return ResponseEntity.notFound().build();
        }

        executionService.executePlaybook(playbook);

        return ResponseEntity.ok(
                "Playbook executed successfully: " + playbook.getName()
        );
    }
}