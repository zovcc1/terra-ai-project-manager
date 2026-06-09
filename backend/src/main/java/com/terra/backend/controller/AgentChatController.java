package com.terra.backend.controller;

import com.terra.backend.dto.request.AiCommandRequest;
import com.terra.backend.dto.request.ConfirmActionRequest;
import com.terra.backend.dto.response.AiCommandResponse;
import com.terra.backend.dto.response.PendingActionResponse;
import com.terra.backend.entity.User;
import com.terra.backend.service.AiCommandService;
import com.terra.backend.service.AuthenticationService;
import com.terra.backend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ai")
public class AgentChatController {

    private final AiCommandService aiCommandService;
    private final UserService userService;
    private final AuthenticationService authenticationService;

    public AgentChatController(AiCommandService aiCommandService, UserService userService, AuthenticationService authenticationService) {
        this.aiCommandService = aiCommandService;
        this.userService = userService;
        this.authenticationService = authenticationService;
    }


    @PostMapping("/command")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiCommandResponse> processCommand(@RequestBody AiCommandRequest request) {
        AiCommandResponse response = aiCommandService.processCommand(request.getMessage());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/confirm/{actionId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> confirmAction(
            @PathVariable Long actionId,
            @RequestBody ConfirmActionRequest request,
            @AuthenticationPrincipal UserDetails principal) {
        User user = authenticationService.resolveUser();
        aiCommandService.handlePendingAction(actionId, user.getId(), request.isApproved());
        return ResponseEntity.ok().build();
    }

    @GetMapping("/pending-actions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<PendingActionResponse>> getPendingActions(@AuthenticationPrincipal UserDetails principal) {
        User user = authenticationService.resolveUser();
        List<PendingActionResponse> actions = aiCommandService.getPendingActions(user.getId());
        return ResponseEntity.ok(actions);
    }

    @DeleteMapping("/pending-actions/{actionId}")
    @PreAuthorize("isAuthenticated() and hasRole('MANAGER')")
    public ResponseEntity<Void> deletePendingAction(@PathVariable Long actionId, @AuthenticationPrincipal UserDetails principal) {
        User user = authenticationService.resolveUser();
        aiCommandService.handlePendingAction(actionId, user.getId(), false);
        return ResponseEntity.ok().build();
    }
}
