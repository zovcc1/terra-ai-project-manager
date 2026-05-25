package com.terra.backend.service;

import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.Role;
import com.terra.backend.entity.User;
import com.terra.backend.exception.UnauthorizedException;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class AuthorizationService {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public AuthorizationService(ProjectRepository projectRepository, TaskRepository taskRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    public void verifyProjectAccess(String username, Long projectId) {
        if (!hasProjectAccess(username, projectId)) {
            throw new UnauthorizedException("Access denied: you are not a member of this project");
        }
    }

    public boolean hasProjectAccess(String username, Long projectId) {
        User user = resolveUser(username);
        if (user.getRole() == Role.ADMIN) return true;

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (project.getManager() != null && project.getManager().getId().equals(user.getId())) return true;

        if (project.getTeam() != null && project.getTeam().getMembers() != null
                && project.getTeam().getMembers().stream().anyMatch(m -> m.getId().equals(user.getId())))
            return true;

        return false;
    }

    public void verifyTaskAccess(String username, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        verifyProjectAccess(username, task.getProject().getId());
    }

    public boolean hasTaskAccess(String username, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        return hasProjectAccess(username, task.getProject().getId());
    }
}
