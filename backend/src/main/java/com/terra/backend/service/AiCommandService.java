package com.terra.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.terra.backend.ai.LlmClient;
import com.terra.backend.ai.PromptTemplateBuilder;
import com.terra.backend.ai.dto.LlmActionResponse;
import com.terra.backend.dto.response.*;
import com.terra.backend.entity.*;
import com.terra.backend.exception.AiProcessingException;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.exception.UnauthorizedException;
import com.terra.backend.repository.PendingActionRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AiCommandService {

    private static final Logger log = LoggerFactory.getLogger(AiCommandService.class);
    private final LlmClient llmClient;
    private final PendingActionRepository pendingActionRepository;
    private final WebSocketService webSocketService;
    private final PromptTemplateBuilder promptTemplateBuilder;
    private final ObjectMapper objectMapper;
    private final RedisStateService redisStateService;
    private final ProjectService projectService;
    private final TaskService taskService;
    private final CommentService commentService;
    private final UserService userService;
    private final AuthenticationService authenticationService;

    public AiCommandResponse processCommand(String message) {

        User user = authenticationService.resolveUser();
        log.info("Processing new command for userId={}, message='{}'", user.getId(), message);

        List<ProjectResponse> userProjects = projectService.getProjectsForUser(user.getId());

        log.debug("Retrieved {} projects for userId={}", userProjects.size(), user.getId());

        if (userProjects.isEmpty()) {
            log.info("No projects found for userId={}, returning empty response", user.getId());
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("ً")
                    .triggerMessage(message)
                    .build();
        }

        String minimalContext = promptTemplateBuilder.buildMinimalProjectList(userProjects);
        log.debug("Built minimal project list for userId={}", user.getId());

        List<String[]> history = redisStateService.getConversationHistory(user.getId(), 10);
        log.debug("Fetched conversation history, length={}", history.size());

        String firstPrompt = promptTemplateBuilder.buildIntentPrompt(minimalContext, message, history);
        log.debug("First prompt (intent) length={}", firstPrompt.length());

        String firstResponse;
        try {
            firstResponse = llmClient.generateResponse(firstPrompt);
            log.debug("First LLM call succeeded");
        } catch (Exception e) {
            log.error("First LLM call failed", e);
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("خطأ في معالج الذكاء الاصطناعي: " + e.getMessage())
                    .triggerMessage(message)
                    .build();
        }

        log.info("Raw first response: {}", firstResponse);
        String firstCleaned = extractJson(firstResponse);
        IntentResponse intent = null;
        if (firstCleaned != null) {
            try {
                // محاولة parse كـ IntentResponse
                intent = objectMapper.readValue(firstCleaned, IntentResponse.class);

                // تحقق إضافي: إذا الـ JSON يحتوي actionType فهو action وليس intent
                // يعني الـ LLM تجاوز المرحلة الأولى مباشرة
                if (firstCleaned.contains("\"actionType\"")) {
                    log.warn("LLM returned action JSON in intent stage, forcing needsData=true");
                    intent = new IntentResponse();
                    intent.setNeedsData(true);
                    intent.setProjectIds(userProjects.stream()
                            .map(ProjectResponse::getId)
                            .collect(Collectors.toList()));
                }
            } catch (Exception e) {
                log.warn("Failed to parse intent JSON: {}", firstCleaned);
                // إذا فشل الـ parse، افترض needsData=true
                intent = new IntentResponse();
                intent.setNeedsData(true);
                intent.setProjectIds(userProjects.stream()
                        .map(ProjectResponse::getId)
                        .collect(Collectors.toList()));
            }
        }

        if (intent == null) {
            log.warn("Intent is null, returning raw response as fallback.");
            redisStateService.addConversationMessage(user.getId(), "user", message);
            redisStateService.addConversationMessage(user.getId(), "assistant", firstResponse);
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage(firstResponse)
                    .triggerMessage(message)
                    .build();
        }

        if (!intent.isNeedsData()) {
            log.info("No detailed data needed, returning direct answer");
            redisStateService.addConversationMessage(user.getId(), "user", message);
            redisStateService.addConversationMessage(user.getId(), "assistant", intent.getMessage());
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage(intent.getMessage())
                    .triggerMessage(message)
                    .build();
        }

        List<Long> requiredProjectIds = intent.getProjectIds();
        if (requiredProjectIds == null || requiredProjectIds.isEmpty()) {
            requiredProjectIds = userProjects.stream().map(ProjectResponse::getId).collect(Collectors.toList());
            log.debug("No specific projectIds in intent, defaulting to all user projects");
        }

        log.debug("Fetching project entities for IDs: {}", requiredProjectIds);
        List<Project> selectedProjects = new ArrayList<>();
        for (Long id : requiredProjectIds) {
            try {
                Project project = projectService.getProjectById(id);
                if (isProjectMember(user, project)) {
                    selectedProjects.add(project);
                }
            } catch (Exception ignored) {
                log.debug("Skipping project {} (not found or not a member)", id);
            }
        }
        log.info("Selected {} projects for full context", selectedProjects.size());

        List<PromptTemplateBuilder.ProjectContext> contexts = buildFullContext(selectedProjects);
        log.debug("Built full context for {} projects", contexts.size());
        String fullContext = promptTemplateBuilder.buildBoardStateString(contexts);
        log.debug("Full board state length={}", fullContext.length());
        List<User> teamMembers = collectTeamMembers(selectedProjects);
        log.debug("Collected {} team members across selected projects", teamMembers.size());

        String fullPrompt = promptTemplateBuilder.buildActionPrompt(fullContext, teamMembers, message, history);
        log.debug("Second prompt (action) length={}", fullPrompt.length());
        String secondResponse;
        try {
            secondResponse = llmClient.generateResponse(fullPrompt);
            log.debug("Second LLM call succeeded");
        } catch (Exception e) {
            retryWithFeedback(fullPrompt, message, e.getMessage(), user.getId());
            log.error("Second LLM call failed", e);
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("خطأ أثناء معالجة التفاصيل: " + e.getMessage())
                    .triggerMessage(message)
                    .build();
        }

        redisStateService.addConversationMessage(user.getId(), "user", message);
        redisStateService.addConversationMessage(user.getId(), "assistant", secondResponse);

        String cleaned = ensureJsonResponse(secondResponse, message, user.getId());
        if (cleaned == null) {
            log.warn("Second response is not valid JSON after correction. Raw: {}", secondResponse);
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("رد غير مفهوم (ليس JSON): " + secondResponse)
                    .triggerMessage(message)
                    .build();
        }

        try {
            LlmActionResponse llmAction = objectMapper.readValue(cleaned, LlmActionResponse.class);
            log.info("Parsed action: type={}, projectId={}, taskId={}",
                    llmAction.getActionType(), llmAction.getProjectId(), llmAction.getTaskId());

            if (!"NONE".equalsIgnoreCase(llmAction.getActionType()) && llmAction.getProjectId() == null) {
                log.warn("Action requires projectId but none provided: {}", llmAction.getActionType());
                return AiCommandResponse.builder()
                        .requiresConfirmation(false)
                        .aiMessage("يرجى تحديد رقم المشروع (projectId) لهذا الإجراء.")
                        .triggerMessage(message)
                        .build();
            }

            Project targetProject = null;
            if (llmAction.getProjectId() != null) {
                targetProject = projectService.getProjectById(llmAction.getProjectId());
                if (!isProjectMember(user, targetProject)) {
                    log.warn("User {} is not a member of project {}", user.getId(), llmAction.getProjectId());
                    return AiCommandResponse.builder()
                            .requiresConfirmation(false)
                            .aiMessage("ليس لديك صلاحية على هذا المشروع.")
                            .triggerMessage(message)
                            .build();
                }
            }

            log.info("Executing action {} on project {}", llmAction.getActionType(),
                    targetProject != null ? targetProject.getId() : "null");
            return executeAction(user, targetProject, llmAction, message);
        } catch (Exception e) {
            log.error("Failed to parse final LLM JSON response", e);
            return AiCommandResponse.builder()
                    .requiresConfirmation(false)
                    .aiMessage("فشل تحليل رد الذكاء الاصطناعي: " + cleaned)
                    .triggerMessage(message)
                    .build();
        }
    }

    private String extractJson(String raw) {
        if (raw == null) return null;
        raw = raw.trim();
        raw = raw.replaceAll("(?s)```json\\s*", "").replaceAll("(?s)```\\s*", "").trim();
        int start = raw.indexOf('{');
        int end = raw.lastIndexOf('}');
        if (start != -1 && end != -1 && start < end) {
            return raw.substring(start, end + 1);
        }
        start = raw.indexOf('[');
        end = raw.lastIndexOf(']');
        if (start != -1 && end != -1 && start < end) {
            return raw.substring(start, end + 1);
        }
        return null;
    }

    private String ensureJsonResponse(String rawResponse, String userMessage, Long userId) {
        String extracted = extractJson(rawResponse);
        if (extracted != null) {
            return extracted;
        }
        String correctionPrompt = "Your last response was not valid JSON. Please provide ONLY the JSON object with the correct action. User command: " + userMessage;
        try {
            String corrected = llmClient.generateResponse(correctionPrompt);
            String correctedJson = extractJson(corrected);
            if (correctedJson != null) {
                redisStateService.addConversationMessage(userId, "assistant", corrected);
                return correctedJson;
            }
        } catch (Exception e) {
            log.error("Correction attempt failed", e);
        }
        return null;
    }

    private List<PromptTemplateBuilder.ProjectContext> buildFullContext(List<Project> projects) {
        log.debug("Building full context for {} projects", projects.size());
        List<PromptTemplateBuilder.ProjectContext> contexts = new ArrayList<>();
        for (Project project : projects) {
            List<Task> tasks = taskService.getTaskEntitiesByProject(project.getId());
            log.debug("Project {} has {} tasks", project.getId(), tasks.size());
            List<PromptTemplateBuilder.TaskContext> taskContexts = new ArrayList<>();
            for (Task task : tasks) {
                PromptTemplateBuilder.TaskContext tc = new PromptTemplateBuilder.TaskContext();
                tc.setTaskId(task.getId());
                tc.setTitle(task.getTitle());
                tc.setStatus(task.getStatus().name());
                tc.setPriority(task.getPriority().name());
                tc.setAssigneeName(task.getAssignee() != null ? task.getAssignee().getFullName() : "غير معين");
                tc.setDueDate(task.getDueDate() != null ? task.getDueDate().toString() : "غير محدد");

                List<CommentResponse> commentResponses = commentService.getCommentsByTask(task.getId());
                log.trace("Task {} has {} comments", task.getId(), commentResponses.size());
                List<String> recent = commentResponses.stream()
                        .sorted(Comparator.comparing(CommentResponse::getCreatedAt).reversed())
                        .limit(3)
                        .map(c -> c.getUserFullName() + " (" + c.getCreatedAt() + "): " +
                                (c.getContent().length() > 80 ? c.getContent().substring(0, 80) + "..." : c.getContent()))
                        .collect(Collectors.toList());
                tc.setRecentComments(recent);
                taskContexts.add(tc);
            }

            PromptTemplateBuilder.ProjectContext pc = new PromptTemplateBuilder.ProjectContext();
            pc.setProjectId(project.getId());
            pc.setProjectName(project.getName());
            pc.setProjectDescription(project.getDescription());
            pc.setTasks(taskContexts);
            contexts.add(pc);
        }
        return contexts;
    }

    private List<User> collectTeamMembers(List<Project> projects) {
        // إذا كان المستخدم طلب مشروعاً واحداً، أعد أعضاءه فقط
        // إذا كانت المشاريع متعددة، اجمع مع إزالة التكرار
        Set<Long> seen = new HashSet<>();
        List<User> members = new ArrayList<>();
        for (Project p : projects) {
            if (p.getTeam() != null && p.getTeam().getMembers() != null) {
                for (User m : p.getTeam().getMembers()) {
                    if (seen.add(m.getId())) {
                        members.add(m);
                    }
                }
            }
            // أضف المدير إذا لم يكن في الفريق
            if (p.getManager() != null && seen.add(p.getManager().getId())) {
                members.add(p.getManager());
            }
        }
        return members;
    }


    private AiCommandResponse executeAction(User user, Project project, LlmActionResponse action, String commandMsg) {
        boolean requiresConfirmation = isSensitiveAction(action);
        log.debug("Action '{}' sensitive = {}", action.getActionType(), requiresConfirmation);

        if (requiresConfirmation) {
            String actionJson;
            try {
                actionJson = objectMapper.writeValueAsString(action);
            } catch (Exception e) {
                log.error("Failed to serialize pending action", e);
                throw new AiProcessingException("فشل تحويل الإجراء إلى نص", e);
            }

            PendingAction pendingAction = PendingAction.builder()
                    .user(user)
                    .actionType(ActionType.valueOf(action.getActionType().toUpperCase()))
                    .targetId(action.getTaskId())
                    .projectId(project != null ? project.getId() : action.getProjectId())
                    .proposedData(actionJson)
                    .naturalLanguageCommand(commandMsg)
                    .status(PendingAction.ActionStatus.PENDING)
                    .expiresAt(LocalDateTime.now().plusMinutes(15))
                    .build();

            pendingActionRepository.save(pendingAction);
            log.info("Created pending action id={} for user {} type={}", pendingAction.getId(), user.getId(), action.getActionType());
            webSocketService.sendAiPendingToUser(user.getId(), pendingAction);

            return AiCommandResponse.builder()
                    .actionId(pendingAction.getId())
                    .requiresConfirmation(true)
                    .aiMessage(action.getMessage())
                    .triggerMessage(commandMsg)
                    .build();
        } else {
            log.info("Executing non-sensitive action {} immediately", action.getActionType());
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
        log.info("Applying action {} on project {}", action.getActionType(), project != null ? project.getId() : "null");

        if (project == null && !"NONE".equalsIgnoreCase(action.getActionType())) {
            throw new AiProcessingException("لم يُحدد مشروع لتنفيذ الإجراء");
        }

        AiCommandResponse.ExecutedAction executed = null;
        String actionType = action.getActionType().toUpperCase();

        switch (actionType) {
            case "CREATE" -> {
                log.debug("Creating task '{}'", action.getTaskTitle());
                Map<String, Object> taskData = buildCreateTaskData(action);
                assert project != null;
                String creatorUsername = project.getManager() != null ? project.getManager().getUsername() : "";
                TaskResponse newTask = taskService.createTask(project.getId(), taskData, creatorUsername);
                log.info("Task created with id={}", newTask.getId());
                executed = new AiCommandResponse.ExecutedAction("CREATE", newTask.getId(), newTask.getTitle(),
                        newTask.getStatus(), newTask.getAssigneeId());
            }
            case "UPDATE", "MOVE", "ASSIGN" -> {
                log.debug("Updating task {} with action {}", action.getTaskId(), actionType);
                if (action.getTaskId() != null) {
                    Map<String, Object> updates = buildUpdateTaskData(action);
                    assert project != null;
                    String updaterUsername = project.getManager() != null ? project.getManager().getUsername() : "";
                    TaskResponse updatedTask = taskService.updateTask(action.getTaskId(), updates, updaterUsername);
                    log.info("Task {} updated successfully", updatedTask.getId());
                    executed = new AiCommandResponse.ExecutedAction(actionType, updatedTask.getId(),
                            updatedTask.getTitle(), updatedTask.getStatus(), updatedTask.getAssigneeId());
                }
            }
            case "DELETE", "DELETE_TASK" -> {
                log.info("Deleting task {}", action.getTaskId());
                if (action.getTaskId() != null) {
                    taskService.deleteTask(action.getTaskId());
                    log.info("Task {} deleted", action.getTaskId());
                    executed = new AiCommandResponse.ExecutedAction(actionType, action.getTaskId(),
                            "Task Deleted", null, null);
                }
            }
        }

        return executed;
    }

    private Map<String, Object> buildCreateTaskData(LlmActionResponse action) {
        Map<String, Object> taskData = new HashMap<>();
        taskData.put("title", action.getTaskTitle());
        taskData.put("description", action.getDescription() != null ? action.getDescription() : "");
        taskData.put("status", action.getStatus() != null ? action.getStatus() : "todo");
        taskData.put("priority", action.getPriority() != null ? action.getPriority() : "medium");
        if (action.getAssigneeId() != null) taskData.put("assigneeId", action.getAssigneeId());
        if (action.getDueDate() != null) taskData.put("dueDate", action.getDueDate());
        return taskData;
    }

    private Map<String, Object> buildUpdateTaskData(LlmActionResponse action) {
        Map<String, Object> updates = new HashMap<>();
        if (action.getTaskTitle() != null) updates.put("title", action.getTaskTitle());
        if (action.getDescription() != null) updates.put("description", action.getDescription());
        if (action.getNewStatus() != null) updates.put("status", action.getNewStatus());
        else if (action.getStatus() != null) updates.put("status", action.getStatus());
        if (action.getPriority() != null) updates.put("priority", action.getPriority());
        if (action.getAssigneeId() != null) updates.put("assigneeId", action.getAssigneeId());
        if (action.getDueDate() != null) updates.put("dueDate", action.getDueDate());
        return updates;
    }

    public List<PendingActionResponse> getPendingActions(Long userId) {
        log.debug("Fetching pending actions for userId={}", userId);
        return pendingActionRepository.findByUserIdAndStatus(userId, PendingAction.ActionStatus.PENDING)
                .stream().map(PendingActionResponse::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public void handlePendingAction(Long actionId, Long userId, boolean approved) {
        log.info("Handling pending action {} for user {}, approved={}", actionId, userId, approved);
        PendingAction action = pendingActionRepository.findById(actionId)
                .orElseThrow(() -> new ResourceNotFoundException("Pending action not found"));

        if (!action.getUser().getId().equals(userId)) {
            log.warn("User {} attempted to handle pending action {} belonging to user {}", userId, actionId, action.getUser().getId());
            throw new UnauthorizedException("لا تملك صلاحية لهذا الإجراء");
        }

        if (approved) {
            action.setStatus(PendingAction.ActionStatus.APPROVED);
            log.info("Pending action {} approved", actionId);
            if (action.getProposedData() != null) {
                try {
                    LlmActionResponse original = objectMapper.readValue(action.getProposedData(), LlmActionResponse.class);
                    Project project = null;
                    if (action.getProjectId() != null) {
                        project = projectService.getProjectById(action.getProjectId());
                    }
                    log.debug("Replaying approved action {}", original.getActionType());
                    applyLlmAction(project, original);
                } catch (Exception e) {
                    log.error("Failed to replay approved pending action {}", actionId, e);
                    throw new AiProcessingException("فشل إعادة تشغيل الإجراء", e);
                }
            } else if (action.getActionType() == ActionType.DELETE) {
                if (action.getTargetId() != null) {
                    log.info("Deleting task {} from pending action", action.getTargetId());
                    taskService.deleteTask(action.getTargetId());
                }
            }
        } else {
            action.setStatus(PendingAction.ActionStatus.REJECTED);
            log.info("Pending action {} rejected", actionId);
        }
        pendingActionRepository.save(action);
    }

    private boolean isProjectMember(User user, Project project) {
        boolean isMember = false;
        if (user.getRole() == Role.ADMIN) isMember = true;
        else if (project.getManager() != null && project.getManager().getId().equals(user.getId())) isMember = true;
        else if (project.getTeam() != null && project.getTeam().getMembers() != null
                && project.getTeam().getMembers().stream().anyMatch(m -> m.getId().equals(user.getId())))
            isMember = true;
        log.trace("Membership check user={} project={}: {}", user.getId(), project.getId(), isMember);
        return isMember;
    }

    private boolean isSensitiveAction(LlmActionResponse action) {
        String type = action.getActionType().toUpperCase();
        boolean sensitive = "DELETE".equals(type) || "DELETE_TASK".equals(type);
        log.trace("Action '{}' is sensitive: {}", type, sensitive);
        return sensitive;
    }

    private void retryWithFeedback(String originalPrompt, String userMessage, String errorDescription, Long userId) {
        String feedbackPrompt = "Your last response could not be processed. Error: " + errorDescription
                + "\nUser command: " + userMessage
                + "\nPlease provide ONLY the required JSON.";
        try {
            String corrected = llmClient.generateResponse(feedbackPrompt);
            String json = extractJson(corrected);
            if (json != null) {
                redisStateService.addConversationMessage(userId, "assistant", corrected);
            }
        } catch (Exception e) {
            log.error("Retry attempt failed", e);
        }
    }

}