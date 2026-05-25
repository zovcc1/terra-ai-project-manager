package com.terra.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AiCommandRequest {
    @NotNull
    private Long projectId;
    @NotBlank
    private String message;
}
