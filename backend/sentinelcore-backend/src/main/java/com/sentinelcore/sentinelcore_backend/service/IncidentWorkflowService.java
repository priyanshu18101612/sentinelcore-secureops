package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.IncidentStatus;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Set;

/**
 * Member 3 — Severity, Assignment, Status-Transition & Resolution workflow.
 * Built entirely on top of Priyanshu's (Member 2) shared Incident entity and
 * IncidentRepository. No new Incident model is created here.
 */
@Service
public class IncidentWorkflowService {

    private final IncidentRepository incidentRepository;

    // Allowed status transitions — enforces the agreed lifecycle:
    // OPEN -> ASSIGNED -> INVESTIGATING -> RESOLVED
    private static final Map<IncidentStatus, Set<IncidentStatus>> ALLOWED_TRANSITIONS = Map.of(
            IncidentStatus.OPEN, Set.of(IncidentStatus.ASSIGNED),
            IncidentStatus.ASSIGNED, Set.of(IncidentStatus.INVESTIGATING),
            IncidentStatus.INVESTIGATING, Set.of(IncidentStatus.RESOLVED),
            IncidentStatus.RESOLVED, Set.of() // terminal state, no further transitions
    );

    public IncidentWorkflowService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    // A. Severity classification
    public Incident updateSeverity(Long incidentId, Severity newSeverity) {
        Incident incident = getOrThrow(incidentId);
        incident.setSeverity(newSeverity);
        return incidentRepository.save(incident);
    }

    // B. Assignment
    public Incident assignTeam(Long incidentId, String team) {
        Incident incident = getOrThrow(incidentId);
        incident.setAssignedTeam(team);
        incident.setAssignedAt(LocalDateTime.now());

        // Assigning a team also advances status forward if it is still OPEN
        if (incident.getStatus() == IncidentStatus.OPEN) {
            incident.setStatus(IncidentStatus.ASSIGNED);
        }
        return incidentRepository.save(incident);
    }

    // C. Status transition (state machine enforced)
    public Incident transitionStatus(Long incidentId, IncidentStatus newStatus) {
        Incident incident = getOrThrow(incidentId);
        IncidentStatus current = incident.getStatus();

        Set<IncidentStatus> allowedNext = ALLOWED_TRANSITIONS.getOrDefault(current, Set.of());

        if (!allowedNext.contains(newStatus)) {
            throw new IllegalStateException(
                    "Invalid transition: " + current + " -> " + newStatus
            );
        }

        incident.setStatus(newStatus);
        return incidentRepository.save(incident);
    }

    // D. Resolution
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
        return incidentRepository.save(incident);
    }

    private Incident getOrThrow(Long id) {
        return incidentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Incident not found: " + id));
    }
}
