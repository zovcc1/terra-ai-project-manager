package com.terra.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiCommandResponse {
    private Long actionId;
    private boolean requiresConfirmation;
    private String aiMessage;
    private String triggerMessage;
    private ExecutedAction executedAction;

    @Data
    public static class ExecutedAction {
        private String actionType;
        private Long taskId;
        private String title;
        private String status;
        private Long assigneeId;

        public ExecutedAction(String actionType, Long taskId, String title, String status, Long assigneeId) {
            this.actionType = actionType;
            this.taskId = taskId;
            this.title = title;
            this.status = status;
            this.assigneeId = assigneeId;
        }
    }
}
