package com.terra.backend.controller;

import com.terra.backend.dto.response.ProjectResponse;
import com.terra.backend.entity.User;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/manager/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final AuthorizationService authorizationService;
    private final UserRepository userRepository;

    public ProjectController(ProjectService projectService, AuthorizationService authorizationService, UserRepository userRepository) {
        this.projectService = projectService;
        this.authorizationService = authorizationService;
        this.userRepository = userRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ProjectResponse>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects().stream()
                .map(ProjectResponse::fromEntity)
                .toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyProjectAccess(principal.getUsername(), id);
        return ResponseEntity.ok(ProjectResponse.fromEntity(projectService.getProjectById(id)));
    }
}
