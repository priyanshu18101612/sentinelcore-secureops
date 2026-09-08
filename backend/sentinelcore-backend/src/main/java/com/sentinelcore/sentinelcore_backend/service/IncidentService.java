package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IncidentService {

    private final IncidentRepository incidentRepository;

    public IncidentService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
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
        return incidentRepository.save(incident);
    }

    public Incident updateIncident(Long id, Incident updatedIncident) {

        Incident existingIncident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found with id: " + id));

        existingIncident.setIncidentId(updatedIncident.getIncidentId());
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
