package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final AuditLogService auditLogService;

    public IncidentService(
            IncidentRepository incidentRepository,
            AuditLogService auditLogService) {
        this.incidentRepository = incidentRepository;
        this.auditLogService = auditLogService;
    }

    public List<Incident> getAllIncidents() {
        return incidentRepository.findAll();
    }

    public Optional<Incident> getIncidentById(Long id) {
        return incidentRepository.findById(id);
    }

    public Optional<Incident> getIncidentByIncidentId(String incidentId) {
        return incidentRepository.findByIncidentId(incidentId);
    }

    public Incident createIncident(Incident incident) {

        if (incident.getIncidentId() == null || incident.getIncidentId().isBlank()) {
            incident.setIncidentId(generateIncidentId());
        }

        Incident savedIncident = incidentRepository.save(incident);

        auditLogService.logAction(
                savedIncident.getId(),
                "INCIDENT_CREATED",
                "SYSTEM",
                "IncidentService",
                "Incident created: " + savedIncident.getIncidentId()
        );

        return savedIncident;
    }

    private String generateIncidentId() {

        int year = java.time.LocalDateTime.now().getYear();

        int nextNumber = incidentRepository
                .findTopByOrderByIdDesc()
                .map(lastIncident -> {
                    try {
                        String incidentId = lastIncident.getIncidentId();
                        String[] parts = incidentId.split("-");
                        return Integer.parseInt(parts[2]) + 1;
                    } catch (Exception e) {
                        return 1;
                    }
                })
                .orElse(1);

        return String.format("INC-%d-%03d", year, nextNumber);
    }

    public Incident updateIncident(Long id, Incident updatedIncident) {

        Incident existingIncident = incidentRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Incident not found with id: " + id));

        if (updatedIncident.getSeverity() != null &&
                updatedIncident.getSeverity() != existingIncident.getSeverity()) {

            auditLogService.logAction(
                    id,
                    "SEVERITY_CHANGED",
                    "SYSTEM",
                    "IncidentService",
                    "Severity changed from "
                            + existingIncident.getSeverity()
                            + " to "
                            + updatedIncident.getSeverity()
            );
        }

        if (updatedIncident.getAssignedTeam() != null &&
                !updatedIncident.getAssignedTeam()
                        .equals(existingIncident.getAssignedTeam())) {

            String action = existingIncident.getAssignedTeam() == null
                    ? "ASSIGNED"
                    : "REASSIGNED";

            auditLogService.logAction(
                    id,
                    action,
                    "SYSTEM",
                    "IncidentService",
                    "Team changed from "
                            + existingIncident.getAssignedTeam()
                            + " to "
                            + updatedIncident.getAssignedTeam()
            );
        }

        if (updatedIncident.getStatus() != null &&
                updatedIncident.getStatus() != existingIncident.getStatus()) {

            auditLogService.logAction(
                    id,
                    "STATUS_CHANGED",
                    "SYSTEM",
                    "IncidentService",
                    "Status changed from "
                            + existingIncident.getStatus()
                            + " to "
                            + updatedIncident.getStatus()
            );
        }

        if (updatedIncident.getResolvedAt() != null &&
                existingIncident.getResolvedAt() == null) {

            auditLogService.logAction(
                    id,
                    "RESOLVED",
                    "SYSTEM",
                    "IncidentService",
                    "Incident resolved"
            );
        }

        existingIncident.setTitle(updatedIncident.getTitle());
        existingIncident.setDescription(updatedIncident.getDescription());
        existingIncident.setSeverity(updatedIncident.getSeverity());
        existingIncident.setStatus(updatedIncident.getStatus());
        existingIncident.setAssignedTeam(updatedIncident.getAssignedTeam());
        existingIncident.setAssignedAt(updatedIncident.getAssignedAt());
        existingIncident.setResolutionNotes(updatedIncident.getResolutionNotes());
        existingIncident.setResolvedAt(updatedIncident.getResolvedAt());

        return incidentRepository.save(existingIncident);
    }

    public void deleteIncident(Long id) {

        if (!incidentRepository.existsById(id)) {
            throw new RuntimeException("Incident not found with id: " + id);
        }

        incidentRepository.deleteById(id);
    }
}