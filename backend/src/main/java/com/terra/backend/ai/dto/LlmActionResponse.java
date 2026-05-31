package com.terra.backend.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Parsed response from the LLM indicating what Kanban action to perform.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LlmActionResponse {
    private String actionType;
    private Long taskId;
    private String taskTitle;
    private String description;
    private String status;
    private String newStatus;
    private String priority;
    private Long assigneeId;
    private String dueDate;
    private String message;
}
