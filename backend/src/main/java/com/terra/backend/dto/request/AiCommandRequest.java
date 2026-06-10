package com.terra.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiCommandRequest {
    @NotBlank
    @Size(min = 1, max = 2000)
    private String message;
}
