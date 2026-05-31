package com.terra.backend.dto.response;

import com.terra.backend.entity.Notification;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class NotificationResponse {
    private Long id;
    private String type;
    private String content;
    private String createdAt;
    private Long targetId;
    private Boolean isRead;
    private String sourceUserName;

    public static NotificationResponse fromEntity(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .type(String.valueOf(notification.getType()))
                .content(notification.getContent())
                .createdAt(notification.getCreatedAt().toString())
                .targetId(notification.getTargetId())
                .isRead(notification.getIsRead())
                .sourceUserName(notification.getSourceUser() != null ? notification.getSourceUser().getFullName() : null)
                .build();
    }
}