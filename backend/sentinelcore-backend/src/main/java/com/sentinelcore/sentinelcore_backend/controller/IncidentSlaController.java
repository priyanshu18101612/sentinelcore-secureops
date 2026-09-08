package com.sentinelcore.sentinelcore_backend.controller;

import com.sentinelcore.sentinelcore_backend.service.IncidentSlaService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/incidents")
public class IncidentSlaController {

    private final IncidentSlaService incidentSlaService;

    public IncidentSlaController(IncidentSlaService incidentSlaService) {
        this.incidentSlaService = incidentSlaService;
    }

    @GetMapping("/{id}/sla")
    public IncidentSlaService.SlaDetails getSla(@PathVariable Long id) {
        return incidentSlaService.calculateSla(id);
    }
}