package com.terra.backend.controller;

import com.terra.backend.dto.request.CommentRequest;
import com.terra.backend.dto.response.CommentResponse;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/member/tasks/{taskId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final UserRepository userRepository;
    private final AuthorizationService authorizationService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasTaskAccess(#principal.username, #taskId)")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long taskId,
                                                             @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), taskId);
        return ResponseEntity.ok(commentService.getCommentsByTask(taskId));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasTaskAccess(#principal.username, #taskId)")
    public ResponseEntity<CommentResponse> addComment(@PathVariable Long taskId,
                                                      @RequestBody CommentRequest request,
                                                      @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), taskId);
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        CommentResponse response = commentService.addComment(taskId, user.getId(), request.getContent());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{commentId}")
    @PreAuthorize("@authorizationService.hasTaskAccess(#principal.username, #taskId)")
    public ResponseEntity<CommentResponse> updateComment(@PathVariable Long taskId,
                                                         @PathVariable Long commentId,
                                                         @RequestBody CommentRequest request,
                                                         @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), taskId);
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(commentService.updateComment(commentId, user.getId(), request.getContent()));
    }

    @DeleteMapping("/{commentId}")
    @PreAuthorize("@authorizationService.hasTaskAccess(#principal.username, #taskId)")
    public ResponseEntity<Void> deleteComment(@PathVariable Long taskId,
                                              @PathVariable Long commentId,
                                              @AuthenticationPrincipal UserDetails principal) {
        authorizationService.verifyTaskAccess(principal.getUsername(), taskId);
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        commentService.deleteComment(commentId, user.getId(), user.getRole());
        return ResponseEntity.noContent().build();
    }
}