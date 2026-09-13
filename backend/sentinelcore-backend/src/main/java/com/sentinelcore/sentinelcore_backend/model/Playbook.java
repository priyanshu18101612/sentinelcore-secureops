package com.sentinelcore.sentinelcore_backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "playbooks")
public class Playbook {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String triggerCondition;

    @ElementCollection
    @CollectionTable(
        name = "playbook_steps",
        joinColumns = @JoinColumn(name = "playbook_id")
    )
    @Column(name = "step")
    private List<String> steps;

    public Playbook() {
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTriggerCondition() {
        return triggerCondition;
    }

    public void setTriggerCondition(String triggerCondition) {
        this.triggerCondition = triggerCondition;
    }

    public List<String> getSteps() {
        return steps;
    }

    public void setSteps(List<String> steps) {
        this.steps = steps;
    }
}