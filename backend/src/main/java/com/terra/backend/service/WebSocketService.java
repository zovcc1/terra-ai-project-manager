package com.terra.backend.service;

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

    public void sendNotificationToUser(Long userId, Object notification) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/notifications", notification);
    }

    public void sendAiPendingToUser(Long userId, Object payload) {
        messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/ai-pending", payload);
    }
}
