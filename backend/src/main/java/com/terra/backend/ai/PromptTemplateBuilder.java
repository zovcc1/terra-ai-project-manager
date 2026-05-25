package com.terra.backend.ai;

import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Builds structured prompts for the LLM including system instructions,
 * compressed board state, and team roster.
 */
@Component
public class PromptTemplateBuilder {

    private static final String SYSTEM_PROMPT = """
            You are an AI project manager assistant for a Kanban board application called Terra.
            You interpret natural language commands and respond with a JSON action.
            
            Available action types:
            - CREATE: Create a new task
            - MOVE: Move a task to a different column
            - UPDATE: Update task properties (title, description, priority, assignee, due date)
            - DELETE: Delete a task
            - ASSIGN: Assign a task to a team member
            - NONE: No action needed, just a response message
            
            Task statuses: todo, doing, review, done
            Task priorities: low, medium, high
            
            You MUST respond with ONLY valid JSON in this exact format:
            {
              "actionType": "CREATE|MOVE|UPDATE|DELETE|ASSIGN|NONE",
              "taskId": null or number (required for MOVE/UPDATE/DELETE/ASSIGN),
              "title": "string" (for CREATE),
              "description": "string" (for CREATE/UPDATE, optional),
              "status": "todo|doing|review|done" (for CREATE/MOVE),
              "priority": "low|medium|high" (for CREATE/UPDATE, optional),
              "assigneeId": number or null (for CREATE/ASSIGN),
              "dueDate": "YYYY-MM-DD" or null,
              "message": "Human-readable explanation in Arabic of what you did or will do"
            }
            
            Rules:
            1. When user says "assign to a frontend developer" or similar, match the skill/role from the team roster.
            2. Default status for new tasks is "todo".
            3. Default priority is "medium".
            4. Always provide a helpful Arabic message explaining the action.
            5. If you cannot determine the action, use actionType "NONE" with a helpful message.
            6. When moving tasks, identify them by title match from the board state.
            """;

    /**
     * Build the full prompt with board context and user command.
     */
    public String buildPrompt(String compressedBoardState, List<User> teamMembers, String userCommand) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("SYSTEM:\n").append(SYSTEM_PROMPT).append("\n\n");

        prompt.append("BOARD STATE:\n").append(compressedBoardState).append("\n\n");

        if (teamMembers != null && !teamMembers.isEmpty()) {
            prompt.append("TEAM ROSTER:\n");
            for (User member : teamMembers) {
                prompt.append(String.format("- ID: %d, Name: %s, Role: %s\n",
                        member.getId(), member.getFullName(), member.getRole().name()));
            }
            prompt.append("\n");
        }

        prompt.append("USER COMMAND:\n").append(userCommand);
        return prompt.toString();
    }

    /**
     * Build a condensed board state string organized by columns.
     */
    public String buildBoardStateString(List<Task> tasks) {
        Map<Task.TaskStatus, List<Task>> byStatus = tasks.stream()
                .collect(Collectors.groupingBy(Task::getStatus));

        StringBuilder sb = new StringBuilder();
        for (Task.TaskStatus status : Task.TaskStatus.values()) {
            List<Task> columnTasks = byStatus.getOrDefault(status, List.of());
            sb.append(String.format("Column '%s' (%d tasks):\n", status.name().toLowerCase(), columnTasks.size()));

            int limit = Math.min(columnTasks.size(), 20);
            for (int i = 0; i < limit; i++) {
                Task t = columnTasks.get(i);
                sb.append(String.format("  - ID:%d, Title:'%s', Priority:%s, Assignee:%s\n",
                        t.getId(),
                        t.getTitle(),
                        t.getPriority().name().toLowerCase(),
                        t.getAssignee() != null ? t.getAssignee().getFullName() : "unassigned"));
            }
            if (columnTasks.size() > 20) {
                sb.append(String.format("  ... and %d more\n", columnTasks.size() - 20));
            }
        }
        return sb.toString();
    }
}
