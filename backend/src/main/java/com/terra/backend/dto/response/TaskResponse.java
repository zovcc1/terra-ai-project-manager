package com.terra.backend.dto.response;

import com.terra.backend.entity.Task;
import lombok.Data;

@Data
public class TaskResponse {
    private Long id;
    private String title;
    private String description;
    private Long projectId;
    private Long assigneeId;
    private String status;
    private String priority;
    private String dueDate;
    private Integer orderIndex;

    public static TaskResponse fromEntity(Task task) {
        TaskResponse r = new TaskResponse();
        r.setId(task.getId());
        r.setTitle(task.getTitle());
        r.setDescription(task.getDescription());
        r.setProjectId(task.getProject() != null ? task.getProject().getId() : null);
        r.setAssigneeId(task.getAssignee() != null ? task.getAssignee().getId() : null);
        r.setStatus(task.getStatus() != null ? task.getStatus().name() : null);
        r.setPriority(task.getPriority() != null ? task.getPriority().name() : null);
        r.setDueDate(task.getDueDate() != null ? task.getDueDate().toString() : null);
        r.setOrderIndex(task.getOrderIndex());
        return r;
    }
}
