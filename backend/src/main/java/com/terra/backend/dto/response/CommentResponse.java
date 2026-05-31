package com.terra.backend.dto.response;

import com.terra.backend.entity.Comment;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class CommentResponse {
    private Long id;
    private String content;
    private String createdAt;
    private Long userId;
    private String userFullName;
    private Long taskId;

    public static CommentResponse fromEntity(Comment comment) {
        return CommentResponse.builder()
                .id(comment.getId())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt().toString())
                .userId(comment.getUser().getId())
                .userFullName(comment.getUser().getFullName())
                .taskId(comment.getTask().getId())
                .build();
    }
}