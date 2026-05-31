package com.terra.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_suggestion_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSuggestionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String suggestionType;

    @ManyToOne
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(columnDefinition = "JSON")
    private String taskIds;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User triggeredBy;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pending_action_id")
    private PendingAction pendingAction;

    private String message;
    private Boolean isDismissed;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (isDismissed == null) isDismissed = false;
    }
}
