package com.sentinelcore.sentinelcore_backend.service;

import com.sentinelcore.sentinelcore_backend.model.Playbook;
import com.sentinelcore.sentinelcore_backend.repository.PlaybookRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PlaybookService {

    private final PlaybookRepository playbookRepository;

    public PlaybookService(PlaybookRepository playbookRepository) {
        this.playbookRepository = playbookRepository;
    }

    public List<Playbook> getAllPlaybooks() {
        return playbookRepository.findAll();
    }

    public Optional<Playbook> getPlaybookById(Long id) {
        return playbookRepository.findById(id);
    }

    public Playbook createPlaybook(Playbook playbook) {
        return playbookRepository.save(playbook);
    }

    public Playbook updatePlaybook(Long id, Playbook playbook) {
        Optional<Playbook> existing = playbookRepository.findById(id);

        if (existing.isEmpty()) {
            return null;
        }

        Playbook current = existing.get();

        current.setName(playbook.getName());
        current.setTriggerCondition(playbook.getTriggerCondition());
        current.setSteps(playbook.getSteps());

        return playbookRepository.save(current);
    }

    public boolean deletePlaybook(Long id) {
        if (!playbookRepository.existsById(id)) {
            return false;
        }

        playbookRepository.deleteById(id);
        return true;
    }
}