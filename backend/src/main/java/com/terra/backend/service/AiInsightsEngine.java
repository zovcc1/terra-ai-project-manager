package com.terra.backend.service;

import com.terra.backend.ai.LlmClient;
import com.terra.backend.entity.AiSuggestionLog;
import com.terra.backend.repository.AiSuggestionLogRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
public class AiInsightsEngine {
    private final LlmClient llmClient;
    private final ContextCompressor contextCompressor;
    private final AiSuggestionLogRepository aiSuggestionLogRepository;
    private final WebSocketService webSocketService;

    public AiInsightsEngine(LlmClient llmClient, ContextCompressor contextCompressor, 
                          AiSuggestionLogRepository aiSuggestionLogRepository, WebSocketService webSocketService) {
        this.llmClient = llmClient;
        this.contextCompressor = contextCompressor;
        this.aiSuggestionLogRepository = aiSuggestionLogRepository;
        this.webSocketService = webSocketService;
    }

    // Architectural fix: Can be called on event
    public void generateInsights(Long projectId) {
        String context = contextCompressor.getCompressedBoardState(projectId);
        String prompt = "Analyze this project state for bottlenecks and WIP limit violations: " + context;
        String response = llmClient.generateResponse(prompt);
        
        AiSuggestionLog log = AiSuggestionLog.builder()
                .suggestionType("BOTTLENECK")
                .project(null) // Fetch project
                .message("WIP limit exceeded in Doing column")
                .build();
        aiSuggestionLogRepository.save(log);
        webSocketService.broadcastKanbanUpdate(projectId, log);
    }

    @Scheduled(cron = "${ai.insights.cron}")
    public void scheduledInsights() {
        // Implementation for all active projects
    }
}
