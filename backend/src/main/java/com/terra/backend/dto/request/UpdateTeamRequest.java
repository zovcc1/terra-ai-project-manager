package com.terra.backend.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Set;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTeamRequest {
    private String name;
    private String description;
    private Long leadId;
    private Set<Long> memberIds;
}