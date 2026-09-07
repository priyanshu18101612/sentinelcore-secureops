package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Incident;
import com.sentinelcore.sentinelcore_backend.model.Severity;
import com.sentinelcore.sentinelcore_backend.repository.IncidentRepository;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;

@Service
public class IncidentSlaService {

    private final IncidentRepository incidentRepository;

    private final Map<Severity, Long> slaHours = Map.of(
            Severity.CRITICAL, 1L,
            Severity.HIGH, 2L,
            Severity.MEDIUM, 4L,
            Severity.LOW, 8L
    );

    public IncidentSlaService(IncidentRepository incidentRepository) {
        this.incidentRepository = incidentRepository;
    }

    public SlaDetails calculateSla(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incident not found"));

        LocalDateTime startTime = incident.getCreatedAt();
        long hours = slaHours.get(incident.getSeverity());

        LocalDateTime deadline = startTime.plusHours(hours);
        LocalDateTime now = LocalDateTime.now();

        String status;
        String remainingTime;

        if (now.isBefore(deadline)) {
            status = "WITHIN_SLA";

            Duration remaining = Duration.between(now, deadline);
            remainingTime = remaining.toHours() + "h "
                    + (remaining.toMinutes() % 60) + "m";
        } else {
            status = "SLA_BREACHED";
            remainingTime = "0h 0m";
        }

        return new SlaDetails(
                status,
                deadline,
                remainingTime
        );
    }

    public record SlaDetails(
            String status,
            LocalDateTime deadline,
            String remainingTime
    ) {
    }
}
