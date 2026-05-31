package com.terra.backend.controller;

import com.terra.backend.dto.response.TaskResponse;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.TaskService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/member/tasks")
public class TaskController {

    private final TaskService taskService;
    private final AuthorizationService authorizationService;
    private final UserRepository userRepository;

    public TaskController(TaskService taskService, AuthorizationService authorizationService,
                          UserRepository userRepository) {
        this.taskService = taskService;
        this.authorizationService = authorizationService;
        this.userRepository = userRepository;
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @GetMapping("/assigned")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<TaskResponse>> getMyTasks(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(taskService.getTasksByAssignee(user.getId()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER') or hasRole('MEMBER')")
    public ResponseEntity<TaskResponse> getTaskById(@PathVariable Long id) {
        Task task =taskService.getTaskById(id);
        TaskResponse response = TaskResponse.fromEntity(task);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestParam Task.TaskStatus status) {
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @PatchMapping("/{id}/move")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasTaskAccess(#principal.username, #id)")
    public ResponseEntity<TaskResponse> moveTask(@PathVariable Long id, @RequestParam Task.TaskStatus status, @RequestParam Integer orderIndex) {
        return ResponseEntity.ok(taskService.moveTask(id, status, orderIndex));
    }

    @PostMapping("/project/{projectId}")
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public ResponseEntity<TaskResponse> createTask(@PathVariable Long projectId,
                                                   @RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(taskService.createTask(projectId, body, principal.getUsername()));
    }

    @PutMapping("/{id}")   // <--- NEW full update endpoint
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasTaskAccess(#principal.username, #id)")
    public ResponseEntity<TaskResponse> updateTask(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body,
                                                   @AuthenticationPrincipal UserDetails principal) {
        return ResponseEntity.ok(taskService.updateTask(id, body, principal.getUsername()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasTaskAccess(#principal.username, #id)")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }
}
