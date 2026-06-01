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
import com.terra.backend.exception.UnauthorizedException;
import com.terra.backend.repository.PendingActionRepository;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.repository.UserSkillRepository;
import com.terra.backend.entity.ActionType;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
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
    private final UserSkillRepository userSkillRepository;
    private final PromptTemplateBuilder promptTemplateBuilder;
    private final ObjectMapper objectMapper;
    private final RedisStateService redisStateService;

    public AiProjectManagerService(LlmClient llmClient, ContextCompressor contextCompressor,
                                   PendingActionRepository pendingActionRepository, WebSocketService webSocketService,
                                   TaskService taskService, TaskRepository taskRepository,
                                   ProjectRepository projectRepository, UserRepository userRepository,
                                   UserSkillRepository userSkillRepository,
                                   PromptTemplateBuilder promptTemplateBuilder, ObjectMapper objectMapper, RedisStateService redisStateService) {
        this.llmClient = llmClient;
        this.contextCompressor = contextCompressor;
        this.pendingActionRepository = pendingActionRepository;
        this.webSocketService = webSocketService;
        this.taskService = taskService;
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.userSkillRepository = userSkillRepository;
        this.promptTemplateBuilder = promptTemplateBuilder;
        this.objectMapper = objectMapper;
        this.redisStateService = redisStateService;
    }

    public AiCommandResponse processCommand(Long userId, Long projectId, String message) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        if (!isProjectMember(user, project)) {
            throw new UnauthorizedException("Access denied: you are not a member of this project");
        }

        List<String[]> history = redisStateService.getConversationHistory(userId, projectId, 10);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        String compressedBoard = promptTemplateBuilder.buildBoardStateString(tasks);
        List<User> teamMembers = project.getTeam() != null ?
                new ArrayList<>(project.getTeam().getMembers()) : new ArrayList<>();
        String prompt = promptTemplateBuilder.buildPrompt(compressedBoard, teamMembers, message,history);


        String responseStr;
        try {
            responseStr = llmClient.generateResponse(prompt);
        } catch (Exception e) {
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("error with processing command" + e.getMessage())
                    .triggerMessage(message)
                    .build();
        }
        redisStateService.addConversationMessage(userId, projectId, "user", message);
        redisStateService.addConversationMessage(userId, projectId, "assistant", responseStr);

        String cleaned = responseStr.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();

        // إذا كان الرد لا يشبه JSON، نعيده كما هو للمعاينة
        if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("الرد من الذكاء الاصطناعي (غير JSON): " + cleaned)
                    .triggerMessage(message)
                    .build();
        }

        try {
            LlmActionResponse llmAction = objectMapper.readValue(cleaned, LlmActionResponse.class);
            return executeAction(user, project, llmAction, message);
        } catch (Exception e) {
            // فشل تحليل JSON
            e.printStackTrace();
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("تم استلام رد غير متوقع من الذكاء الاصطناعي. الرد كان: " + cleaned)
                    .triggerMessage(message)
                    .build();
        }
    }

    private AiCommandResponse executeAction(User user, Project project, LlmActionResponse action, String commandMsg) {
        boolean requiresConfirmation = isSensitiveAction(action);
        
        if (requiresConfirmation) {
            String actionJson = null;
            try {
                actionJson = objectMapper.writeValueAsString(action);
            } catch (Exception e) {
                throw new AiProcessingException("Failed to serialize action for confirmation", e);
            }

            PendingAction pendingAction = PendingAction.builder()
                    .user(user)
                    .actionType(ActionType.valueOf(action.getActionType().toUpperCase()))
                    .targetId(action.getTaskId())
                    .projectId(project.getId())
                    .proposedData(actionJson)
                    .naturalLanguageCommand(commandMsg)
                    .status(PendingAction.ActionStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();
            
            pendingActionRepository.save(pendingAction);
            webSocketService.sendAiPendingToUser(user.getId(), pendingAction);
            
            return AiCommandResponse.builder()
                    .actionId(pendingAction.getId())
                    .requiresConfirmation(true)
                    .aiMessage(action.getMessage())
                    .triggerMessage(commandMsg)
                    .build();
        } else {
            AiCommandResponse.ExecutedAction executed = applyLlmAction(project, action);
            
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .executedAction(executed)
                    .aiMessage(action.getMessage())
                    .triggerMessage(commandMsg)
                    .build();
        }
    }

    private AiCommandResponse.ExecutedAction applyLlmAction(Project project, LlmActionResponse action) {
        AiCommandResponse.ExecutedAction executed = null;
        
        if ("CREATE".equalsIgnoreCase(action.getActionType())) {
            Task newTask = new Task();
            newTask.setProject(project);
            newTask.setTitle(action.getTaskTitle());
            newTask.setDescription(action.getDescription());
            newTask.setStatus(parseStatus(action.getStatus(), Task.TaskStatus.TODO));
            newTask.setPriority(parsePriority(action.getPriority(), Task.Priority.MEDIUM));
            if (action.getAssigneeId() != null) {
                userRepository.findById(action.getAssigneeId()).ifPresent(newTask::setAssignee);
            }
            if (action.getDueDate() != null) {
                try {
                    newTask.setDueDate(LocalDate.parse(action.getDueDate()));
                } catch (Exception e) {
                    // Log error or ignore invalid date
                }
            }
            Task saved = taskRepository.save(newTask);

            executed = new AiCommandResponse.ExecutedAction("CREATE", saved.getId(), saved.getTitle(), saved.getStatus().name(), saved.getAssignee() != null ? saved.getAssignee().getId() : null);
        } else if ("UPDATE".equalsIgnoreCase(action.getActionType()) || "MOVE".equalsIgnoreCase(action.getActionType()) || "ASSIGN".equalsIgnoreCase(action.getActionType())) {
            if (action.getTaskId() != null) {
                Task task = taskRepository.findById(action.getTaskId()).orElseThrow(() -> new ResourceNotFoundException("Task not found"));
                if (action.getTaskTitle() != null) task.setTitle(action.getTaskTitle());
                if (action.getDescription() != null) task.setDescription(action.getDescription());
                if (action.getNewStatus() != null) task.setStatus(parseStatus(action.getNewStatus(), task.getStatus()));
                else if (action.getStatus() != null) task.setStatus(parseStatus(action.getStatus(), task.getStatus()));
                if (action.getPriority() != null) task.setPriority(parsePriority(action.getPriority(), task.getPriority()));
                if (action.getAssigneeId() != null) {
                    userRepository.findById(action.getAssigneeId()).ifPresent(task::setAssignee);
                }
                if (action.getDueDate() != null) {
                    try {
                        task.setDueDate(LocalDate.parse(action.getDueDate()));
                    } catch (Exception e) {
                        // ignore
                    }
                }
                taskRepository.save(task);
                executed = new AiCommandResponse.ExecutedAction(action.getActionType(), task.getId(), task.getTitle(), task.getStatus().name(), task.getAssignee() != null ? task.getAssignee().getId() : null);
            }
        } else if ("DELETE".equalsIgnoreCase(action.getActionType()) || "DELETE_TASK".equalsIgnoreCase(action.getActionType())) {
            if (action.getTaskId() != null) {
                taskService.deleteTask(action.getTaskId());
                executed = new AiCommandResponse.ExecutedAction(action.getActionType(), action.getTaskId(), "Task Deleted", null, null);
            }
        }
        
        return executed;
    }

    public List<PendingActionResponse> getPendingActions(Long userId) {
        return pendingActionRepository.findByUserIdAndStatus(userId, PendingAction.ActionStatus.PENDING)
                .stream().map(PendingActionResponse::fromEntity).collect(Collectors.toList());
    }

    public void handlePendingAction(Long actionId, Long userId, boolean approved) {
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending action not found"));
                
        if (!action.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Unauthorized to handle this action");
        }
        
        if (approved) {
            action.setStatus(PendingAction.ActionStatus.APPROVED);
            if (action.getProposedData() != null) {
                try {
                    LlmActionResponse original = objectMapper.readValue(action.getProposedData(), LlmActionResponse.class);
                    Project project = null;
                    if (action.getProjectId() != null) {
                        project = projectRepository.findById(action.getProjectId()).orElse(null);
                    }
                    applyLlmAction(project, original);
                } catch (Exception e) {
                    throw new AiProcessingException("Failed to replay pending action", e);
                }
            } else if ("DELETE_TASK".equals(action.getActionType()) || "DELETE".equals(action.getActionType())) {
                if (action.getTargetId() != null) {
                    taskService.deleteTask(action.getTargetId());
                }
            }
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
