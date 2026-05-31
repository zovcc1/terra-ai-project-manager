package com.terra.backend.service;

import com.terra.backend.dto.request.CreateProjectRequest;
import com.terra.backend.dto.request.UpdateProjectRequest;
import com.terra.backend.dto.response.ProjectResponse;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Team;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TeamRepository;
import com.terra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }
    public List<ProjectResponse> getProjectsForUser(Long userId) {
        // Optional: verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found");
        }
        List<Project> projects = projectRepository.findProjectsByUser(userId);
        return projects.stream()
                .map(ProjectResponse::fromEntity)
                .collect(Collectors.toList());
    }
    @Transactional
    public Project createProject(CreateProjectRequest request, String managerEmail) {
        User manager = userRepository.findByUsername(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        Team team = null;
        if (request.getTeamId() != null) {
            team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            if (!team.getLead().getId().equals(manager.getId())) {
                throw new RuntimeException("You can only create projects for teams you lead");
            }
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .team(team)
                .manager(manager)
                .dueDate(request.getDueDate())
                .priority(request.getPriority() != null
                        ? Project.Priority.valueOf(request.getPriority().toUpperCase())
                        : Project.Priority.MEDIUM)
                .status(Project.ProjectStatus.ACTIVE)
                .progress(0)
                .build();

        return projectRepository.save(project);
    }

    @Transactional
    public Project updateProject(Long id, UpdateProjectRequest request, String managerEmail) {
        Project project = getProjectById(id);
        User manager = userRepository.findByUsername(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));

        if (!project.getManager().getId().equals(manager.getId())) {
            throw new RuntimeException("You can only edit your own projects");
        }

        if (request.getName() != null) project.setName(request.getName());
        if (request.getDescription() != null) project.setDescription(request.getDescription());
        if (request.getDueDate() != null) project.setDueDate(request.getDueDate());
        if (request.getPriority() != null)
            project.setPriority(Project.Priority.valueOf(request.getPriority().toUpperCase()));
        if (request.getStatus() != null)
            project.setStatus(Project.ProjectStatus.valueOf(request.getStatus().toUpperCase()));

        if (request.getTeamId() != null) {
            Team team = teamRepository.findById(request.getTeamId())
                    .orElseThrow(() -> new RuntimeException("Team not found"));
            if (!team.getLead().getId().equals(manager.getId())) {
                throw new RuntimeException("You can only assign teams you lead");
            }
            project.setTeam(team);
        }

        return projectRepository.save(project);
    }

    @Transactional
    public void deleteProject(Long id, String managerEmail) {
        Project project = getProjectById(id);
        User manager = userRepository.findByUsername(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        if (!project.getManager().getId().equals(manager.getId())) {
            throw new RuntimeException("You can only delete your own projects");
        }
        projectRepository.delete(project);
    }

    public List<Project> getProjectsByManager(String managerEmail) {
        User manager = userRepository.findByEmail(managerEmail)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        return projectRepository.findByManagerId(manager.getId());
    }
}
