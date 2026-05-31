package com.terra.backend.service;

import com.terra.backend.dto.response.CommentResponse;
import com.terra.backend.dto.response.NotificationResponse;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
public class WebSocketService {
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketService(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcastKanbanUpdate(Long projectId, Object payload) {
        messagingTemplate.convertAndSend("/topic/kanban/" + projectId, payload);
    }

    public void sendAiPendingToUser(Long userId, Object payload) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/ai-pending", payload);
    }
    public void sendCommentToTask(Long taskId, CommentResponse comment) {
        messagingTemplate.convertAndSend("/topic/task/" + taskId + "/comments", comment);
    }

    public void sendCommentDeletion(Long taskId, Long commentId) {
        messagingTemplate.convertAndSend("/topic/task/" + taskId + "/comments",
                new DeleteCommentMessage(commentId));
    }

    public void sendCommentUpdate(Long taskId, CommentResponse comment) {
        messagingTemplate.convertAndSend("/topic/task/" + taskId + "/comments", comment);
    }

    public void sendNotificationToUser(Long userId, NotificationResponse notification) {
        messagingTemplate.convertAndSend("/topic/user/" + userId + "/notifications", notification);
    }

    // Helper class for deletion events
    public static class DeleteCommentMessage {
        private String type = "DELETE_COMMENT";
        private Long commentId;
        public DeleteCommentMessage(Long commentId) { this.commentId = commentId; }
        public String getType() { return type; }
        public Long getCommentId() { return commentId; }
    }


}
