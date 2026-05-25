package com.terra.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terra.backend.ai.LlmClient;
import com.terra.backend.ai.PromptTemplateBuilder;
import com.terra.backend.ai.dto.LlmActionResponse;
import com.terra.backend.dto.response.AiCommandResponse;
import com.terra.backend.dto.response.PendingActionResponse;
import com.terra.backend.entity.PendingAction;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Role;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.exception.AiProcessingException;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.PendingActionRepository;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AiProjectManagerService {
    private final LlmClient llmClient;
    private final ContextCompressor contextCompressor;
    private final PendingActionRepository pendingActionRepository;
    private final WebSocketService webSocketService;
    private final TaskService taskService;
    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final PromptTemplateBuilder promptTemplateBuilder;
    private final ObjectMapper objectMapper;

    public AiProjectManagerService(LlmClient llmClient, ContextCompressor contextCompressor, 
                                 PendingActionRepository pendingActionRepository, WebSocketService webSocketService,
                                 TaskService taskService, TaskRepository taskRepository,
                                 ProjectRepository projectRepository, UserRepository userRepository,
                                 PromptTemplateBuilder promptTemplateBuilder, ObjectMapper objectMapper) {
        this.llmClient = llmClient;
        this.contextCompressor = contextCompressor;
        this.pendingActionRepository = pendingActionRepository;
        this.webSocketService = webSocketService;
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.promptTemplateBuilder = promptTemplateBuilder;
        this.objectMapper = objectMapper;
    }

    public AiCommandResponse processCommand(Long userId, Long projectId, String message) {
        User user = userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId).orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!isProjectMember(user, project)) {
            throw new RuntimeException("Access denied: you are not a member of this project");
        }
        
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        String compressedBoard = promptTemplateBuilder.buildBoardStateString(tasks);
        List<User> teamMembers = project.getTeam() != null ? new ArrayList<>(project.getTeam().getMembers()) : new ArrayList<>();
        
        String prompt = promptTemplateBuilder.buildPrompt(compressedBoard, teamMembers, message);
        String responseStr = llmClient.generateResponse(prompt);
        
        try {
            LlmActionResponse llmAction = objectMapper.readValue(responseStr, LlmActionResponse.class);
            return executeAction(user, project, llmAction, message);
        } catch (Exception e) {
            throw new AiProcessingException("Failed to parse LLM response: " + responseStr, e);
        }
    }

    private AiCommandResponse executeAction(User user, Project project, LlmActionResponse action, String commandMsg) {
        boolean requiresConfirmation = isSensitiveAction(action);
        
        if (requiresConfirmation) {
            PendingAction pendingAction = PendingAction.builder()
                    .user(user)
                    .actionType(action.getActionType())
                    .targetId(action.getTaskId())
                    .naturalLanguageCommand(commandMsg)
                    .status(PendingAction.ActionStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();
            
            // Store raw action JSON in some generic field if needed, but for now we rely on re-running or storing actionType/targetId
            // A better architecture would serialize LlmActionResponse into a 'payload' field of PendingAction.
            
            pendingActionRepository.save(pendingAction);
            webSocketService.sendAiPendingToUser(user.getId(), pendingAction);
            
            return AiCommandResponse.builder()
                    .actionId(pendingAction.getId())
                    .requiresConfirmation(true)
                    .aiMessage(action.getMessage())
                    .triggerMessage(commandMsg)
                    .build();
        } else {
            AiCommandResponse.ExecutedAction executed = null;
            
            if ("CREATE".equalsIgnoreCase(action.getActionType())) {
                Task newTask = new Task();
                newTask.setProject(project);
                newTask.setTitle(action.getTitle());
                newTask.setDescription(action.getDescription());
                newTask.setStatus(parseStatus(action.getStatus(), Task.TaskStatus.TODO));
                newTask.setPriority(parsePriority(action.getPriority(), Task.Priority.MEDIUM));
                if (action.getAssigneeId() != null) {
                    userRepository.findById(action.getAssigneeId()).ifPresent(newTask::setAssignee);
                }
                if (action.getDueDate() != null) {
                    newTask.setDueDate(LocalDate.parse(action.getDueDate()));
                }
                Task saved = taskRepository.save(newTask); // Instead of taskService.createTask, as it handles web sockets differently, let's just use service if possible, but taskService needs Task object
                taskService.createTask(saved);
                
                executed = new AiCommandResponse.ExecutedAction("CREATE", saved.getId(), saved.getTitle(), saved.getStatus().name(), saved.getAssignee() != null ? saved.getAssignee().getId() : null);
            } else if ("UPDATE".equalsIgnoreCase(action.getActionType()) || "MOVE".equalsIgnoreCase(action.getActionType()) || "ASSIGN".equalsIgnoreCase(action.getActionType())) {
                if (action.getTaskId() != null) {
                    Task task = taskRepository.findById(action.getTaskId()).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
                    if (action.getTitle() != null) task.setTitle(action.getTitle());
                    if (action.getDescription() != null) task.setDescription(action.getDescription());
                    if (action.getStatus() != null) task.setStatus(parseStatus(action.getStatus(), task.getStatus()));
                    if (action.getPriority() != null) task.setPriority(parsePriority(action.getPriority(), task.getPriority()));
                    if (action.getAssigneeId() != null) {
                        userRepository.findById(action.getAssigneeId()).ifPresent(task::setAssignee);
                    }
                    if (action.getDueDate() != null) {
                        task.setDueDate(LocalDate.parse(action.getDueDate()));
                    }
                    taskService.updateTask(task);
                    executed = new AiCommandResponse.ExecutedAction(action.getActionType(), task.getId(), task.getTitle(), task.getStatus().name(), task.getAssignee() != null ? task.getAssignee().getId() : null);
                }
            }
            
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .executedAction(executed)
                    .aiMessage(action.getMessage())
                    .triggerMessage(commandMsg)
                    .build();
        }
    }

    public List<PendingActionResponse> getPendingActions(Long userId) {
        return pendingActionRepository.findByUserIdAndStatus(userId, PendingAction.ActionStatus.PENDING)
                .stream().map(PendingActionResponse::fromEntity).collect(Collectors.toList());
    }

    public void handlePendingAction(Long actionId, Long userId, boolean approved) {
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending action not found"));
                
        if (!action.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized to handle this action");
        }
        
        if (approved) {
            action.setStatus(PendingAction.ActionStatus.APPROVED);
            if ("DELETE_TASK".equals(action.getActionType()) || "DELETE".equals(action.getActionType())) {
                if (action.getTargetId() != null) {
                    taskService.deleteTask(action.getTargetId());
                }
            }
            // For now, only DELETE is sensitive. Add other types as needed.
        } else {
            action.setStatus(PendingAction.ActionStatus.REJECTED);
        }
        pendingActionRepository.save(action);
    }

    private boolean isProjectMember(User user, Project project) {
        if (user.getRole() == Role.ADMIN) return true;
        if (project.getManager() != null && project.getManager().getId().equals(user.getId())) return true;
        if (project.getTeam() != null && project.getTeam().getMembers() != null
                && project.getTeam().getMembers().stream().anyMatch(m -> m.getId().equals(user.getId()))) return true;
        return false;
    }

    private boolean isSensitiveAction(LlmActionResponse action) {
        return "DELETE".equalsIgnoreCase(action.getActionType()) || "DELETE_TASK".equalsIgnoreCase(action.getActionType());
    }
    
    private Task.TaskStatus parseStatus(String s, Task.TaskStatus def) {
        if (s == null) return def;
        try { return Task.TaskStatus.valueOf(s.toUpperCase()); } catch (Exception e) { return def; }
    }

    private Task.Priority parsePriority(String p, Task.Priority def) {
        if (p == null) return def;
        try { return Task.Priority.valueOf(p.toUpperCase()); } catch (Exception e) { return def; }
    }
}
