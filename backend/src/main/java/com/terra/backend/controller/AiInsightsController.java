package com.terra.backend.controller;

import com.terra.backend.entity.AiSuggestionLog;
import com.terra.backend.repository.AiSuggestionLogRepository;
import com.terra.backend.service.AiInsightsEngine;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai/insights")
public class AiInsightsController {
    private final AiSuggestionLogRepository repository;
    private final AiInsightsEngine engine;

    public AiInsightsController(AiSuggestionLogRepository repository, AiInsightsEngine engine) {
        this.repository = repository;
        this.engine = engine;
    }

    @GetMapping("/kanban/{projectId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AiSuggestionLog>> getKanbanInsights(@PathVariable Long projectId) {
        return ResponseEntity.ok(repository.findByProjectIdAndIsDismissedFalse(projectId));
    }

    @GetMapping("/analytics")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<AiSuggestionLog>> getAnalyticsInsights() {
        return ResponseEntity.ok(repository.findBySuggestionTypeAndIsDismissedFalse("BOTTLENECK"));
    }

    @PostMapping("/{id}/dismiss")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> dismissInsight(@PathVariable Long id) {
        repository.findById(id).ifPresent(log -> {
            log.setIsDismissed(true);
            repository.save(log);
        });
        return ResponseEntity.ok().build();
    }
}
