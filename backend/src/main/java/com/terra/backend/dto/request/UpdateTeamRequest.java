package com.terra.backend.dto.request;

import lombok.*;
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