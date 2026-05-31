package com.terra.backend.service;

import com.terra.backend.dto.response.NotificationResponse;
import com.terra.backend.entity.*;
import com.terra.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final WebSocketService webSocketService;

    @Transactional
    public void createMentionNotification(User recipient, User source, Task task, String commentPreview) {
        String content = String.format("%s ذكرك في تعليق على مهمة '%s': \"%s\"",
                source.getFullName(), task.getTitle(), commentPreview);
        Notification notification = Notification.builder()
                .user(recipient)
                .sourceUser(source)
                .type(Notification.NotificationType.MENTION)
                .content(content)
                .targetId(task.getId())
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);

        // Push real-time notification to the recipient's WebSocket channel
        webSocketService.sendNotificationToUser(recipient.getId(), NotificationResponse.fromEntity(saved));
    }

    @Transactional
    public void createTaskCommentNotification(User recipient, User commentAuthor, Task task, String commentPreview) {
        // For notifying assignee when someone comments on their task (optional)
        String content = String.format("%s علق على مهمتك '%s': \"%s\"",
                commentAuthor.getFullName(), task.getTitle(), commentPreview);
        Notification notification = Notification.builder()
                .user(recipient)
                .sourceUser(commentAuthor)
                .type(Notification.NotificationType.COMMENT)
                .content(content)
                .targetId(task.getId())
                .isRead(false)
                .build();
        Notification saved = notificationRepository.save(notification);
        webSocketService.sendNotificationToUser(recipient.getId(), NotificationResponse.fromEntity(saved));
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public List<NotificationResponse> getRecentNotifications(Long userId, int limit) {
        return notificationRepository.findTop20ByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(limit)
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public void markAsRead(Long userId, List<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) return;
        notificationRepository.markAsRead(userId, notificationIds);
    }
}