package com.terra.backend.service;

import com.terra.backend.ai.LlmClient;
import com.terra.backend.entity.AiSuggestionLog;
import com.terra.backend.entity.Project;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.AiSuggestionLogRepository;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AiInsightsEngine {
    private final LlmClient llmClient;
    private final ContextCompressor contextCompressor;
    private final AiSuggestionLogRepository aiSuggestionLogRepository;
    private final WebSocketService webSocketService;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public AiInsightsEngine(LlmClient llmClient, ContextCompressor contextCompressor, 
                          AiSuggestionLogRepository aiSuggestionLogRepository, WebSocketService webSocketService,
                          ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.llmClient = llmClient;
        this.contextCompressor = contextCompressor;
        this.aiSuggestionLogRepository = aiSuggestionLogRepository;
        this.webSocketService = webSocketService;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    // Architectural fix: Can be called on event
    public void generateInsights(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
        
        String context = contextCompressor.getCompressedBoardState(projectId);
        String prompt = "Analyze this project state for bottlenecks and WIP limit violations. Project state: " + context;
        String response = llmClient.generateResponse(prompt);
        
        // Use LLM response as the message
        AiSuggestionLog log = AiSuggestionLog.builder()
                .suggestionType("BOTTLENECK")
                .project(project)
                .message(response != null ? response : "نلاحظ تراكم المهام في عمود التنفيذ، قد تحتاج لمراجعة توزيع المهام.")
                .isDismissed(false)
                .build();
        aiSuggestionLogRepository.save(log);
        webSocketService.broadcastKanbanUpdate(projectId, log);
    }

    @Scheduled(cron = "${ai.insights.cron:0 0 * * * *}")
    public void scheduledInsights() {
        List<Project> activeProjects = projectRepository.findAll();
        for (Project project : activeProjects) {
            try {
                generateInsights(project.getId());
            } catch (Exception e) {
                // Log error
            }
        }
    }
}
