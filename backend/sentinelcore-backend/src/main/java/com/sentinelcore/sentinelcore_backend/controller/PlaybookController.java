package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.Playbook;
import com.sentinelcore.sentinelcore_backend.service.PlaybookService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/playbooks")
public class PlaybookController {

    private final PlaybookService playbookService;

    public PlaybookController(PlaybookService playbookService) {
        this.playbookService = playbookService;
    }

    @GetMapping
    public List<Playbook> getAllPlaybooks() {
        return playbookService.getAllPlaybooks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Playbook> getPlaybookById(@PathVariable Long id) {
        return playbookService.getPlaybookById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Playbook> createPlaybook(@RequestBody Playbook playbook) {
        return ResponseEntity.ok(playbookService.createPlaybook(playbook));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Playbook> updatePlaybook(
            @PathVariable Long id,
            @RequestBody Playbook playbook) {

        Playbook updated = playbookService.updatePlaybook(id, playbook);

        if (updated == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePlaybook(@PathVariable Long id) {

        if (!playbookService.deletePlaybook(id)) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }
}