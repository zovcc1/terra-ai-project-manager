package com.terra.backend.service;

import com.terra.backend.dto.response.TaskResponse;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.exception.UnauthorizedException;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final WebSocketService webSocketService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AuthorizationService authorizationService;

    public TaskService(TaskRepository taskRepository, WebSocketService webSocketService,
                       UserRepository userRepository, ProjectRepository projectRepository,
                       AuthorizationService authorizationService) {
        this.taskRepository = taskRepository;
        this.webSocketService = webSocketService;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.authorizationService = authorizationService;
    }

    public List<Task> getTaskEntitiesByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("task not found"));
    }

    public List<TaskResponse> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<TaskResponse> getTasksByAssignee(Long userId) {
        return taskRepository.findByAssigneeId(userId).stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public TaskResponse updateTaskStatus(Long taskId, Task.TaskStatus status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        Task updated = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(updated);
        webSocketService.broadcastKanbanUpdate(task.getProject().getId(), response);
        return response;
    }

    @Transactional
    public TaskResponse moveTask(Long taskId, Task.TaskStatus status, Integer orderIndex, String actingUsername) {
        authorizationService.verifyTaskAccess(actingUsername, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(status);
        task.setOrderIndex(orderIndex);
        Task updated = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(updated);
        webSocketService.broadcastKanbanUpdate(task.getProject().getId(), response);
        return response;
    }

    @Transactional
    public TaskResponse createTask(Long projectId, Map<String, Object> body, String currentUsername) {
        authorizationService.verifyProjectAccess(currentUsername, projectId);
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));

        Task task = new Task();
        task.setProject(project);
        task.setTitle((String) body.getOrDefault("title", "New Task"));
        if (body.get("description") != null) task.setDescription((String) body.get("description"));
        task.setStatus(body.get("status") != null ? parseStatus((String) body.get("status")) : Task.TaskStatus.TODO);
        task.setPriority(body.get("priority") != null ? parsePriority((String) body.get("priority")) : Task.Priority.MEDIUM);
        if (body.get("dueDate") instanceof String dd) {
            task.setDueDate(LocalDate.parse(dd));
        }

        if (body.get("assigneeId") != null) {
            Long assigneeId = Long.parseLong(body.get("assigneeId").toString());
            User assignee = userRepository.findById(assigneeId)
                    .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            boolean isValid = (project.getTeam() != null && project.getTeam().getMembers().contains(assignee))
                    || (project.getManager() != null && project.getManager().equals(assignee));
            if (!isValid) {
                throw new UnauthorizedException("Assignee must be a member of the project's team or the project manager");
            }
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(saved);
        webSocketService.broadcastKanbanUpdate(projectId, response);
        return response;
    }

    @Transactional
    public TaskResponse updateTask(Long taskId, Map<String, Object> body, String currentUsername) {
        authorizationService.verifyTaskAccess(currentUsername, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));

        if (body.containsKey("title")) task.setTitle((String) body.get("title"));
        if (body.containsKey("description")) task.setDescription((String) body.get("description"));
        if (body.containsKey("status"))
            task.setStatus(parseStatus((String) body.get("status")));
        if (body.containsKey("priority"))
            task.setPriority(parsePriority((String) body.get("priority")));
        if (body.containsKey("dueDate") && body.get("dueDate") instanceof String dd) {
            task.setDueDate(LocalDate.parse(dd));
        }

        if (body.containsKey("assigneeId")) {
            Long assigneeId = body.get("assigneeId") != null ? Long.parseLong(body.get("assigneeId").toString()) : null;
            if (assigneeId == null) {
                task.setAssignee(null);
            } else {
                User assignee = userRepository.findById(assigneeId)
                        .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
                Project project = task.getProject();
                boolean isValid = (project.getTeam() != null && project.getTeam().getMembers().contains(assignee))
                        || (project.getManager() != null && project.getManager().equals(assignee));
                if (!isValid) {
                    throw new UnauthorizedException("Assignee must be a team member or project manager");
                }
                task.setAssignee(assignee);
            }
        }

        Task updated = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(updated);
        webSocketService.broadcastKanbanUpdate(task.getProject().getId(), response);
        return response;
    }

    @Transactional
    public void deleteTask(Long taskId, String actingUsername) {
        authorizationService.verifyTaskAccess(actingUsername, taskId);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Long projectId = task.getProject().getId();
        taskRepository.delete(task);
        webSocketService.broadcastKanbanUpdate(projectId,
                Map.of("type", "DELETE_TASK", "taskId", taskId, "projectId", projectId));
    }

    private Task.TaskStatus parseStatus(String value) {
        try {
            return Task.TaskStatus.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "قيمة الحالة غير صحيحة: '" + value + "'. القيم المقبولة: todo, doing, review, done");
        }
    }

    private Task.Priority parsePriority(String value) {
        try {
            return Task.Priority.valueOf(value.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException(
                    "قيمة الأولوية غير صحيحة: '" + value + "'. القيم المقبولة: low, medium, high");
        }
    }
}
