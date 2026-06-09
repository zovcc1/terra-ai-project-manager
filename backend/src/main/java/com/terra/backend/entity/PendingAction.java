package com.terra.backend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "pending_actions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PendingAction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    @Enumerated(EnumType.STRING)
    private ActionType actionType;
    private Long targetId;
    private Long projectId;

    @Column(columnDefinition = "JSON")
    private String proposedData;

    private String naturalLanguageCommand;

    @Enumerated(EnumType.STRING)
    private ActionStatus status;

    private LocalDateTime createdAt;
    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ActionStatus.PENDING;
    }

    public enum ActionStatus {PENDING, APPROVED, REJECTED, EXPIRED}
}
