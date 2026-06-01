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
        You are an AI project manager assistant for a Kanban board called Terra.
        You interpret natural language commands and respond with a JSON action.

        Available action types:
        - CREATE: Create a new task
        - MOVE: Move a task to a different column
        - UPDATE: Update task properties
        - DELETE: Delete a task
        - ASSIGN: Assign a task to a team member
        - NONE: No action needed

        Task statuses: todo, doing, review, done
        Task priorities: low, medium, high

        You MUST respond with ONLY valid JSON matching EXACTLY one of these schemas:

        CREATE:
        {"actionType":"CREATE","taskTitle":"string","description":"string","status":"todo","priority":"medium","assigneeId":null,"message":"string"}

        MOVE:
        {"actionType":"MOVE","taskId":1,"newStatus":"doing","message":"string"}

        UPDATE:
        {"actionType":"UPDATE","taskId":1,"taskTitle":"string","description":"string","priority":"medium","assigneeId":1,"message":"string"}

        DELETE:
        {"actionType":"DELETE","taskId":1,"message":"string"}

        ASSIGN:
        {"actionType":"ASSIGN","taskId":1,"assigneeId":1,"message":"string"}

        NONE:
        {"actionType":"NONE","message":"string"}

        Rules:
        1. Use assigneeId from TEAM ROSTER only. Never invent IDs.
        2. Use taskId from BOARD STATE only. Never invent IDs.
        3. Default status for new tasks is "todo".
        4. Default priority is "medium".
        5. Always write message in Arabic.
        6. Do NOT use markdown. Start with { and end with }.""";

    /**
     * Build the full prompt with board context and user command.
     */
    public String buildPrompt(String compressedBoardState, List<User> teamMembers, String userCommand,List<String[]> conversationHistory) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("SYSTEM:\n").append(SYSTEM_PROMPT).append("\n\n");

        prompt.append("BOARD STATE:\n").append(compressedBoardState).append("\n\n");

        if (teamMembers != null && !teamMembers.isEmpty()) {
            prompt.append("TEAM ROSTER:\n");
            for (User member : teamMembers) {
                prompt.append(String.format("- ID: %d, Name: %s, Role: %s",
                        member.getId(), member.getFullName(), member.getRole().name()));
            }
            prompt.append("\n");
        }
        if (conversationHistory != null && !conversationHistory.isEmpty()) {
            prompt.append("--- سجل المحادثة السابقة ---\n");
            for (String[] turn : conversationHistory) {
                String role = turn[0];
                String content = turn[1];
                if ("user".equals(role)) prompt.append("المستخدم: ").append(content).append("\n");
                else if ("assistant".equals(role)) prompt.append("المساعد: ").append(content).append("\n");
            }
            prompt.append("--- نهاية السجل ---\n\n");
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
