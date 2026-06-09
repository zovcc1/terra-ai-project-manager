package com.terra.backend.controller;

import com.terra.backend.dto.request.CreateTeamRequest;
import com.terra.backend.dto.request.UpdateTeamRequest;
import com.terra.backend.dto.response.AdminUserResponse;
import com.terra.backend.dto.response.TeamResponse;
import com.terra.backend.repository.TeamRepository;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.TeamService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class TeamController {

    private final UserRepository userRepository;
    private final TeamService teamService;

    public TeamController(UserRepository userRepository, TeamRepository teamRepository, TeamService teamService) {
        this.userRepository = userRepository;
        this.teamService = teamService;
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AdminUserResponse>> getAllUsers() {
        return ResponseEntity.ok(
                userRepository.findAll().stream()
                        .map(AdminUserResponse::fromEntity)
                        .collect(Collectors.toList())
        );
    }

    @GetMapping("/teams")
    @PreAuthorize("hasRole('ADMIN') OR hasRole('MANAGER')")
    public ResponseEntity<List<TeamResponse>> getAllTeams() {
        return ResponseEntity.ok(
                teamService.getAllTeams().stream()
                        .map(TeamResponse::fromEntity)
                        .collect(Collectors.toList())
        );
    }

    @PostMapping("/teams")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamResponse> createTeam(@RequestBody CreateTeamRequest team) {
        return ResponseEntity.ok(TeamResponse.fromEntity(teamService.createTeam(team)));
    }

    @PutMapping("/teams/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<TeamResponse> updateTeam(@PathVariable Long id, @RequestBody UpdateTeamRequest team) {
        return ResponseEntity.ok(TeamResponse.fromEntity(teamService.updateTeam(id, team)));
    }

    @DeleteMapping("/teams/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id);
        return ResponseEntity.noContent().build();
    }
}
