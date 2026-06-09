package com.terra.backend.dto.response;

import com.terra.backend.entity.Team;
import com.terra.backend.entity.User;
import lombok.Builder;
import lombok.Getter;

import java.util.Set;
import java.util.stream.Collectors;

@Getter
@Builder
public class TeamResponse {
    private Long id;
    private String name;
    private String description;
    private String leadName;
    private Long leadId;
    private Set<Long> memberIds;
    private int memberCount;

    public static TeamResponse fromEntity(Team team) {
        return TeamResponse.builder()
                .id(team.getId())
                .name(team.getName())
                .description(team.getDescription())
                .leadName(team.getLead() != null ? team.getLead().getFullName() : null)
                .leadId(team.getLead() != null ? team.getLead().getId() : null)
                .memberIds(team.getMembers().stream()
                        .map(User::getId)
                        .collect(Collectors.toSet()))
                .memberCount(team.getMembers().size())
                .build();
    }
}