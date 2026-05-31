package com.terra.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SystemStatsResponse {
    private long totalUsers;
    private int activeProjects;
    private int completedTasksThisMonth;
    private String uptime;
}
