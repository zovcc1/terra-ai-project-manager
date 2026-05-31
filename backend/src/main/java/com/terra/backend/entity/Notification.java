package com.terra.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne
    @JoinColumn(name = "source_user_id")
    private User sourceUser;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private NotificationType type;

    private String content;

    private Long targetId;

    private Boolean isRead;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isRead == null) isRead = false;
    }


    public enum NotificationType {
        MENTION,
        COMMENT,
        TASK_ASSIGNED,
        PROJECT_CREATED,
        PROJECT_UPDATED,
        TASK_STATUS_CHANGED,
        TASK_DUE_SOON
    }
}
