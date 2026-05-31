package com.terra.backend.dto.request;

import lombok.Data;
import java.time.LocalDate;

@Data
public class CreateProjectRequest {
    private String name;
    private String description;
    private Long teamId;
    private LocalDate dueDate;
    private String priority; // LOW, MEDIUM, HIGH
}