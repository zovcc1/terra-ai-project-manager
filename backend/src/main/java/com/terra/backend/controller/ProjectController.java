package com.terra.backend.controller;

import com.terra.backend.dto.request.CreateProjectRequest;
import com.terra.backend.dto.request.UpdateProjectRequest;
import com.terra.backend.dto.response.ProjectResponse;
import com.terra.backend.dto.response.UserResponse;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final AuthorizationService authorizationService;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    // --- Manager endpoints ---

    @GetMapping("/manager/projects")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects().stream()
                .map(ProjectResponse::fromEntity)
                .collect(Collectors.toList()));
    }

    @GetMapping("/manager/projects/{id}")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id,
                                                          @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyProjectAccess(principal.getUsername(), id);
        return ResponseEntity.ok(ProjectResponse.fromEntity(projectService.getProjectById(id)));
    }

    @GetMapping("/member/projects")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername()).orElseThrow();
        List<ProjectResponse> projects = projectService.getProjectsForUser(user.getId());
        return ResponseEntity.ok(projects);
    }
    @PostMapping("/manager/projects")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ProjectResponse> createProject(@RequestBody CreateProjectRequest request,
                                                         @AuthenticationPrincipal UserDetails principal) {
        Project project = projectService.createProject(request, principal.getUsername());
        return ResponseEntity.ok(ProjectResponse.fromEntity(project));
    }

    @PutMapping("/manager/projects/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<ProjectResponse> updateProject(@PathVariable Long id,
                                                         @RequestBody UpdateProjectRequest request,
                                                         @AuthenticationPrincipal UserDetails principal) {
        Project project = projectService.updateProject(id, request, principal.getUsername());
        return ResponseEntity.ok(ProjectResponse.fromEntity(project));
    }

    @DeleteMapping("/manager/projects/{id}")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id,
                                              @AuthenticationPrincipal UserDetails principal) {
        projectService.deleteProject(id, principal.getUsername());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/manager/projects/{projectId}/members")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<List<UserResponse>> getProjectMembers(@PathVariable Long projectId,
                                                                @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyProjectAccess(principal.getUsername(), projectId);
        Project project = projectService.getProjectById(projectId);
        Set<com.terra.backend.entity.User> members = new HashSet<>();
        if (project.getTeam() != null && project.getTeam().getMembers() != null) {
            members.addAll(project.getTeam().getMembers());
        }
        if (project.getManager() != null) {
            members.add(project.getManager());
        }
        return ResponseEntity.ok(members.stream().map(UserResponse::fromEntity).collect(Collectors.toList()));
    }

    @GetMapping("/manager/projects/{projectId}/stats")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getProjectStats(@PathVariable Long projectId,
                                                               @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyProjectAccess(principal.getUsername(), projectId);
        List<Task> tasks = taskRepository.findByProjectId(projectId);
        long total = tasks.size();
        long done = tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.DONE).count();
        long overdue = tasks.stream().filter(t ->
                t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != Task.TaskStatus.DONE
        ).count();
        return ResponseEntity.ok(Map.of(
                "totalTasks", total,
                "completedTasks", done,
                "inProgressTasks", tasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.DOING).count(),
                "overdueTasks", overdue,
                "completionRate", total > 0 ? (int)(done * 100 / total) : 0
        ));
    }

    // --- Manager analytics ---

    @GetMapping("/manager/analytics")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<Map<String, Object>> getManagerAnalytics(@AuthenticationPrincipal UserDetails principal) {
        List<Project> projects = projectService.getProjectsByManager(principal.getUsername());
        int totalProjects = projects.size();
        int activeProjects = (int) projects.stream().filter(p -> p.getStatus() == Project.ProjectStatus.ACTIVE).count();
        int completedProjects = (int) projects.stream().filter(p -> p.getStatus() == Project.ProjectStatus.COMPLETED).count();

        List<Task> allTasks = new ArrayList<>();
        for (Project p : projects) {
            allTasks.addAll(taskRepository.findByProjectId(p.getId()));
        }
        long totalTasks = allTasks.size();
        long completedTasks = allTasks.stream().filter(t -> t.getStatus() == Task.TaskStatus.DONE).count();
        long overdueTasks = allTasks.stream().filter(t ->
                t.getDueDate() != null && t.getDueDate().isBefore(LocalDate.now())
                        && t.getStatus() != Task.TaskStatus.DONE).count();

        return ResponseEntity.ok(Map.of(
                "totalProjects", totalProjects,
                "activeProjects", activeProjects,
                "completedProjects", completedProjects,
                "totalTasks", totalTasks,
                "completedTasks", completedTasks,
                "overdueTasks", overdueTasks,
                "completionRate", totalTasks > 0 ? (int)(completedTasks * 100 / totalTasks) : 0
        ));
    }
}