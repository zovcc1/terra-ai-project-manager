package com.terra.backend.controller;

import com.terra.backend.dto.request.AiCommandRequest;
import com.terra.backend.dto.request.ConfirmActionRequest;
import com.terra.backend.dto.response.AiCommandResponse;
import com.terra.backend.dto.response.PendingActionResponse;
import com.terra.backend.entity.User;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AiProjectManagerService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AiCommandController {

    private final AiProjectManagerService aiProjectManagerService;
    private final UserRepository userRepository;

    public AiCommandController(AiProjectManagerService aiProjectManagerService, UserRepository userRepository) {
        this.aiProjectManagerService = aiProjectManagerService;
        this.userRepository = userRepository;
    }

    private User resolveUser(@AuthenticationPrincipal UserDetails principal) {
        return userRepository.findByUsername(principal.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    @PostMapping("/command")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiCommandResponse> processCommand(
            @RequestBody AiCommandRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolveUser(principal);
        AiCommandResponse response = aiProjectManagerService.processCommand(user.getId(), request.getProjectId(), request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm/{actionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> confirmAction(
            @PathVariable Long actionId,
            @RequestBody ConfirmActionRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = resolveUser(principal);
        aiProjectManagerService.handlePendingAction(actionId, user.getId(), request.isApproved());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending-actions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingActionResponse>> getPendingActions(@AuthenticationPrincipal UserDetails principal) {
        User user = resolveUser(principal);
        List<PendingActionResponse> actions = aiProjectManagerService.getPendingActions(user.getId());
        return ResponseEntity.ok(actions);
    }

    @DeleteMapping("/pending-actions/{actionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deletePendingAction(@PathVariable Long actionId, @AuthenticationPrincipal UserDetails principal) {
        User user = resolveUser(principal);
        aiProjectManagerService.handlePendingAction(actionId, user.getId(), false);
        return ResponseEntity.ok().build();
    }
}
