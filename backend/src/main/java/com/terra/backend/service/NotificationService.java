package com.terra.backend.service;

import com.terra.backend.dto.response.NotificationResponse;
import com.terra.backend.entity.Notification;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private static final Logger log = LogManager.getLogger(NotificationService.class);
    private final NotificationRepository notificationRepository;
    private final WebSocketService webSocketService;

    @Transactional
    public void createMentionNotification(User recipient, User source, Task task, String commentPreview) {
        String content = String.format("%s ذكرك في تعليق على مهمة '%s': \"%s\"",
                source.getFullName(), task.getTitle(), commentPreview);
        log.info("content المحتوى{}", content);
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
        log.info("Sending notification to user: {}", recipient.getUsername());
        webSocketService.sendNotificationToUser(recipient.getUsername(), NotificationResponse.fromEntity(saved));
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
        webSocketService.sendNotificationToUser(recipient.getUsername(), NotificationResponse.fromEntity(saved));
    }

    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        return notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    public Page<NotificationResponse> getRecentNotifications(Long userId, Pageable pageable) {
        // Fetch the dynamic page of entities from the database
        Page<Notification> notifications = notificationRepository.findByUserId(userId, pageable);

        // Map the Entity page directly into a DTO page
        return notifications.map(NotificationResponse::fromEntity);
    }


    @Transactional
    public void markAsRead(Long userId, List<Long> notificationIds) {
        if (notificationIds == null || notificationIds.isEmpty()) return;
        notificationRepository.markAsRead(userId, notificationIds);
    }
}