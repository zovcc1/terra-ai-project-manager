package com.terra.backend.service;

import com.terra.backend.dto.response.TaskResponse;
import com.terra.backend.entity.Task;
import com.terra.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TaskService {
    private final TaskRepository taskRepository;
    private final WebSocketService webSocketService;

    public TaskService(TaskRepository taskRepository, WebSocketService webSocketService) {
        this.taskRepository = taskRepository;
        this.webSocketService = webSocketService;
    }

    public List<TaskResponse> getTasksByProject(Long projectId) {
        return taskRepository.findByProjectId(projectId).stream()
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
    public TaskResponse moveTask(Long taskId, Task.TaskStatus status, Integer orderIndex) {
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
    public TaskResponse createTask(Task task) {
        Task saved = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(saved);
        webSocketService.broadcastKanbanUpdate(saved.getProject().getId(), response);
        return response;
    }

    @Transactional
    public TaskResponse updateTask(Task task) {
        Task updated = taskRepository.save(task);
        TaskResponse response = TaskResponse.fromEntity(updated);
        webSocketService.broadcastKanbanUpdate(updated.getProject().getId(), response);
        return response;
    }

    @Transactional
    public void deleteTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        Long projectId = task.getProject().getId();
        taskRepository.delete(task);
        
        // Broadcast a generic update or a specific delete message
        // For now, returning null or empty update to refresh board can be done by frontend fetching again,
        // or we broadcast a dummy TaskResponse with a special flag.
        // We will just let the webSocketService send a refresh ping if implemented.
    }
}
