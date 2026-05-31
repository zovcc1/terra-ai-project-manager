package com.terra.backend.service;

import com.terra.backend.dto.request.CreateTeamRequest;
import com.terra.backend.dto.request.UpdateTeamRequest;
import com.terra.backend.entity.Team;
import com.terra.backend.entity.User;
import com.terra.backend.exception.AlreadyExisitException;
import com.terra.backend.exception.ResourceNotFoundException;
import com.terra.backend.repository.TeamRepository;
import com.terra.backend.repository.UserRepository;
import org.checkerframework.checker.nullness.qual.MonotonicNonNull;
import org.springframework.stereotype.Service;

import java.rmi.AlreadyBoundException;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TeamService {
    private final TeamRepository teamRepository;
    private final UserRepository userRepository;

    public TeamService(TeamRepository teamRepository, UserRepository userRepository) {
        this.teamRepository = teamRepository;
        this.userRepository = userRepository;
    }

    public List<Team> getAllTeams() {
        return teamRepository.findAll();
    }

    public Team getTeamById(Long id){
        return teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("team not found"));
    }

    public Team createTeam(CreateTeamRequest request) {
        if (teamRepository.existsByNameIgnoreCase(request.getName())) {
            throw new AlreadyExisitException("team already exist");
        }

        Team team = Team.builder()
                .name(request.getName())
                .description(request.getDescription())
                .lead(request.getLeadId() != null
                        ? userRepository.findById(request.getLeadId())
                        .orElseThrow(() -> new RuntimeException("قائد الفريق غير موجود"))
                        : null)
                .members(request.getMemberIds() != null && !request.getMemberIds().isEmpty()
                        ? new HashSet<>(userRepository.findAllById(request.getMemberIds()))
                        : new HashSet<>())
                .build();

        return teamRepository.save(team);
    }
    public Team updateTeam(Long id, UpdateTeamRequest request) {
        Team team = getTeamById(id);

        if (!team.getName().equalsIgnoreCase(request.getName())
                && teamRepository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("اسم الفريق موجود بالفعل");
        }

        team.setName(request.getName());
        team.setDescription(request.getDescription());
        team.setLead(request.getLeadId() != null
                ? userRepository.findById(request.getLeadId())
                .orElseThrow(() -> new RuntimeException("قائد الفريق غير موجود"))
                : null);

        Set<User> newMembers = request.getMemberIds() != null
                ? new HashSet<>(userRepository.findAllById(request.getMemberIds()))
                : new HashSet<>();
        team.setMembers(newMembers);

        return teamRepository.save(team);
    }

    public void deleteTeam(Long id) {
        teamRepository.deleteById(id);
    }
}