package com.terra.backend.controller;

import com.terra.backend.dto.request.MarkNotificationReadRequest;
import com.terra.backend.dto.response.NotificationResponse;
import com.terra.backend.entity.User;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnread(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(notificationService.getUnreadNotifications(user.getId()));
    }

    @GetMapping("/recent")
    public ResponseEntity<List<NotificationResponse>> getRecent(@AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(notificationService.getRecentNotifications(user.getId(), 20));
    }

    @PostMapping("/read")
    public ResponseEntity<Void> markAsRead(@RequestBody MarkNotificationReadRequest request,
                                           @AuthenticationPrincipal UserDetails principal) {
        User user = userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        notificationService.markAsRead(user.getId(), request.getNotificationIds());
        return ResponseEntity.ok().build();
    }
}