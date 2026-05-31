package com.terra.backend.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AiSettingsResponse {
    private String provider;
    private String model;
    private String apiKeyMasked;
    private boolean enabled;
    private String defaultModel;
}
