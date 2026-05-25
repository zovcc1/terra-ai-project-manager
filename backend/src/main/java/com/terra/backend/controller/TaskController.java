package com.terra.backend.controller;

import com.terra.backend.dto.response.TaskResponse;
import com.terra.backend.entity.Task;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/member/tasks")
public class TaskController {

    private final TaskService taskService;
    private final AuthorizationService authorizationService;

    public TaskController(TaskService taskService, AuthorizationService authorizationService) {
        this.taskService = taskService;
        this.authorizationService = authorizationService;
    }

    @GetMapping("/project/{projectId}")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasProjectAccess(#principal.username, #projectId)")
    public ResponseEntity<List<TaskResponse>> getTasksByProject(@PathVariable Long projectId, @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyProjectAccess(principal.getUsername(), projectId);
        return ResponseEntity.ok(taskService.getTasksByProject(projectId));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasTaskAccess(#principal.username, #id)")
    public ResponseEntity<TaskResponse> updateStatus(@PathVariable Long id, @RequestParam Task.TaskStatus status, @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), id);
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @PatchMapping("/{id}/move")
    @PreAuthorize("hasRole('ADMIN') or @authorizationService.hasTaskAccess(#principal.username, #id)")
    public ResponseEntity<TaskResponse> moveTask(@PathVariable Long id, @RequestParam Task.TaskStatus status, @RequestParam Integer orderIndex, @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), id);
        return ResponseEntity.ok(taskService.moveTask(id, status, orderIndex));
    }
}
