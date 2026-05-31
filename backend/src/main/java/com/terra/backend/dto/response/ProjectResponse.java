package com.terra.backend.dto.response;

import com.terra.backend.entity.Project;
import lombok.Data;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Data
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private Long teamId;
    private Long managerId;
    private String dueDate;
    private String priority;
    private String status;
    private Integer progress;
    private String createdAt;
    private List<TaskResponse> tasks;
    public static ProjectResponse fromEntity(Project project) {
        ProjectResponse r = new ProjectResponse();
        r.setId(project.getId());
        r.setName(project.getName());
        r.setDescription(project.getDescription());
        r.setTeamId(project.getTeam() != null ? project.getTeam().getId() : null);
        r.setManagerId(project.getManager() != null ? project.getManager().getId() : null);
        r.setDueDate(project.getDueDate() != null ? project.getDueDate().toString() : null);
        r.setPriority(project.getPriority() != null ? project.getPriority().name() : null);
        r.setStatus(project.getStatus() != null ? project.getStatus().name() : null);
        r.setProgress(project.getProgress());
        r.setCreatedAt(project.getCreatedAt() != null ? project.getCreatedAt().toString() : null);
        r.setTasks(Optional.ofNullable(project.getTasks())
                .orElse(Collections.emptyList())
                .stream()
                .map(TaskResponse::fromEntity)
                .collect(Collectors.toList()));

        return r;
    }
}
