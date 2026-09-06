package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.service.IncidentService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
public class IncidentController {

    private final IncidentService incidentService;

    public IncidentController(IncidentService incidentService) {
        this.incidentService = incidentService;
    }

    @GetMapping
    public List<Incident> getAllIncidents() {
        return incidentService.getAllIncidents();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id) {
        return incidentService.getIncidentById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Incident> createIncident(@RequestBody Incident incident) {
        Incident createdIncident = incidentService.createIncident(incident);
        return ResponseEntity.ok(createdIncident);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Incident> updateIncident(
            @PathVariable Long id,
            @RequestBody Incident incident) {

        try {
            Incident updatedIncident =
                    incidentService.updateIncident(id, incident);

            return ResponseEntity.ok(updatedIncident);

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncident(@PathVariable Long id) {

        try {
            incidentService.deleteIncident(id);
            return ResponseEntity.noContent().build();

        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}