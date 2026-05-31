package com.terra.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyEmailRequest {
    @NotBlank
    private String email;

    @NotBlank
    private String token;
}
