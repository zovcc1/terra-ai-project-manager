package com.terra.backend.controller;

import com.terra.backend.dto.response.SystemStatsResponse;
import com.terra.backend.entity.Project;
import com.terra.backend.entity.Task;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.lang.management.ManagementFactory;
import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@RestController
@RequestMapping("/api/admin/stats")
public class AdminStatsController {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;

    public AdminStatsController(UserRepository userRepository, ProjectRepository projectRepository, TaskRepository taskRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<SystemStatsResponse> getStats() {
        long totalUsers = userRepository.count();
        long activeProjects = projectRepository.countByStatus(Project.ProjectStatus.ACTIVE);
        
        LocalDateTime startOfMonth = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0);
        long completedThisMonth = taskRepository.countByStatusAndUpdatedAtAfter(Task.TaskStatus.DONE, startOfMonth);

        return ResponseEntity.ok(SystemStatsResponse.builder()
                .totalUsers(totalUsers)
                .activeProjects((int) activeProjects)
                .completedTasksThisMonth((int) completedThisMonth)
                .uptime(getReadableUptime())
                .build());
    }

    private String getReadableUptime() {
        long uptimeMillis = ManagementFactory.getRuntimeMXBean().getUptime();
        long days = TimeUnit.MILLISECONDS.toDays(uptimeMillis);
        long hours = TimeUnit.MILLISECONDS.toHours(uptimeMillis) % 24;
        long minutes = TimeUnit.MILLISECONDS.toMinutes(uptimeMillis) % 60;
        
        if (days > 0) return String.format("%dd %dh %dm", days, hours, minutes);
        if (hours > 0) return String.format("%dh %dm", hours, minutes);
        return String.format("%dm", minutes);
    }
}
