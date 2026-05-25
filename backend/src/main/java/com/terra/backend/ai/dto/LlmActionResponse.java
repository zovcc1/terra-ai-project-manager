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
    private String actionType;  // CREATE, MOVE, UPDATE, DELETE, ASSIGN, NONE
    private Long taskId;        // For MOVE, UPDATE, DELETE, ASSIGN
    private String title;       // For CREATE
    private String description; // For CREATE, UPDATE
    private String status;      // todo, doing, review, done
    private String priority;    // low, medium, high
    private Long assigneeId;    // For CREATE, ASSIGN
    private String dueDate;     // ISO date string
    private String message;     // Human-readable message from the AI
}
