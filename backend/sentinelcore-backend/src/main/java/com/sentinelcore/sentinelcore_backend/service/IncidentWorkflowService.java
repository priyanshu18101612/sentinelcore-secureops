package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

@Service
public class IncidentWorkflowService {

    private final IncidentRepository incidentRepository;
    private final AuditLogService auditLogService;

    private static final Map<IncidentStatus, Set<IncidentStatus>> ALLOWED_TRANSITIONS = Map.of(
            IncidentStatus.OPEN, Set.of(IncidentStatus.ASSIGNED),
            IncidentStatus.ASSIGNED, Set.of(IncidentStatus.INVESTIGATING),
            IncidentStatus.INVESTIGATING, Set.of(IncidentStatus.RESOLVED),
            IncidentStatus.RESOLVED, Set.of()
    );

    public IncidentWorkflowService(
            IncidentRepository incidentRepository,
            AuditLogService auditLogService) {
        this.incidentRepository = incidentRepository;
        this.auditLogService = auditLogService;
    }

    public Incident updateSeverity(Long incidentId, Severity newSeverity) {
        Incident incident = getOrThrow(incidentId);
        Severity oldSeverity = incident.getSeverity();

        incident.setSeverity(newSeverity);
        Incident saved = incidentRepository.save(incident);

        if (oldSeverity != newSeverity) {
            auditLogService.logAction(
                    incidentId,
                    "SEVERITY_CHANGED",
                    "SYSTEM",
                    "IncidentWorkflowService",
                    "Severity changed from " + oldSeverity + " to " + newSeverity
            );
        }

        return saved;
    }

    public Incident assignTeam(Long incidentId, String team) {
        Incident incident = getOrThrow(incidentId);

        String oldTeam = incident.getAssignedTeam();

        incident.setAssignedTeam(team);
        incident.setAssignedAt(LocalDateTime.now());

        if (incident.getStatus() == IncidentStatus.OPEN) {
            incident.setStatus(IncidentStatus.ASSIGNED);
        }

        Incident saved = incidentRepository.save(incident);

        String action = oldTeam == null ? "ASSIGNED" : "REASSIGNED";

        auditLogService.logAction(
                incidentId,
                action,
                "SYSTEM",
                "IncidentWorkflowService",
                "Team changed from " + oldTeam + " to " + team
        );

        return saved;
    }

    public Incident transitionStatus(Long incidentId, IncidentStatus newStatus) {
        Incident incident = getOrThrow(incidentId);
        IncidentStatus current = incident.getStatus();

        Set<IncidentStatus> allowedNext =
                ALLOWED_TRANSITIONS.getOrDefault(current, Set.of());

        if (!allowedNext.contains(newStatus)) {
            throw new IllegalStateException(
                    "Invalid transition: " + current + " -> " + newStatus
            );
        }

        incident.setStatus(newStatus);
        Incident saved = incidentRepository.save(incident);

        auditLogService.logAction(
                incidentId,
                "STATUS_CHANGED",
                "SYSTEM",
                "IncidentWorkflowService",
                "Status changed from " + current + " to " + newStatus
        );

        return saved;
    }

    public Incident resolveIncident(Long incidentId, String resolutionNotes) {
        Incident incident = getOrThrow(incidentId);

        if (incident.getStatus() != IncidentStatus.INVESTIGATING) {
            throw new IllegalStateException(
                    "Incident must be INVESTIGATING before it can be RESOLVED"
            );
        }

        incident.setStatus(IncidentStatus.RESOLVED);
        incident.setResolutionNotes(resolutionNotes);
        incident.setResolvedAt(LocalDateTime.now());

        Incident saved = incidentRepository.save(incident);

        auditLogService.logAction(
                incidentId,
                "RESOLVED",
                "SYSTEM",
                "IncidentWorkflowService",
                "Incident resolved"
        );

        return saved;
    }

    private Incident getOrThrow(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() ->
                        new IllegalArgumentException("Incident not found: " + id));
    }
}