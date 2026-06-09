package com.terra.backend.service;

import com.terra.backend.dto.response.CommentResponse;
import com.terra.backend.entity.Comment;
import com.terra.backend.entity.Role;
import com.terra.backend.entity.Task;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.exception.UnauthorizedException;
import com.terra.backend.repository.CommentRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private static final Pattern MENTION_PATTERN = Pattern.compile("@(\\w+)");
    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final WebSocketService webSocketService;

    public List<CommentResponse> getCommentsByTask(Long taskId) {
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
                .stream()
                .map(CommentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CommentResponse addComment(Long taskId, Long authorId, String content) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found"));
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Comment comment = Comment.builder()
                .task(task)
                .user(author)
                .content(content)
                .build();
        Comment saved = commentRepository.save(comment);

        // Send real-time comment to all subscribers of this task
        webSocketService.sendCommentToTask(taskId, CommentResponse.fromEntity(saved));

        // Detect mentions and create notifications

        detectMentions(content, task, author);


        return CommentResponse.fromEntity(saved);
    }

    private void detectMentions(String content, Task task, User commentAuthor) {
        Matcher matcher = MENTION_PATTERN.matcher(content);
        while (matcher.find()) {
            String username = matcher.group(1);
            userRepository.findByUsername(username).ifPresent(mentionedUser -> {
                // Do not notify the comment author themselves
                if (!mentionedUser.getId().equals(commentAuthor.getId())) {
                    notificationService.createMentionNotification(
                            mentionedUser,
                            commentAuthor,
                            task,
                            content.substring(0, Math.min(100, content.length()))
                    );
                }
            });
        }
    }

    @Transactional
    public void deleteComment(Long commentId, Long currentUserId, Role currentRole) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        // Only comment author OR manager/admin can delete
        if (!comment.getUser().getId().equals(currentUserId) &&
                currentRole != Role.ADMIN && currentRole != Role.MANAGER) {
            throw new UnauthorizedException("You can only delete your own comments");
        }
        commentRepository.delete(comment);
        // Optionally broadcast deletion
        webSocketService.sendCommentDeletion(comment.getTask().getId(), commentId);
    }

    // Optional: update comment (only author)
    @Transactional
    public CommentResponse updateComment(Long commentId, Long userId, String newContent) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new ResourceNotFoundException("Comment not found"));
        if (!comment.getUser().getId().equals(userId)) {
            throw new UnauthorizedException("Only the comment author can edit it");
        }
        comment.setContent(newContent);
        Comment updated = commentRepository.save(comment);
        webSocketService.sendCommentUpdate(updated.getTask().getId(), CommentResponse.fromEntity(updated));
        return CommentResponse.fromEntity(updated);
    }
}
