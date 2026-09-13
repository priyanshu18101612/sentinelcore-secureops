package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Playbook;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaybookExecutionService {

    public void executePlaybook(Playbook playbook) {

        if (playbook == null) {
            throw new IllegalArgumentException("Playbook cannot be null");
        }

        List<String> steps = playbook.getSteps();

        if (steps == null || steps.isEmpty()) {
            System.out.println("No steps found for playbook: " + playbook.getName());
            return;
        }

        System.out.println("Starting playbook: " + playbook.getName());

        for (int i = 0; i < steps.size(); i++) {

            String step = steps.get(i);

            System.out.println(
                    "Executing step " + (i + 1) + ": " + step
            );

            // Step execution logic will be connected here.
            // Examples: isolate, block, notify, ticket.
        }

        System.out.println(
                "Playbook completed: " + playbook.getName()
        );
    }
}