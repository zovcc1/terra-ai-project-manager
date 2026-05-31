package com.terra.backend.dto.request;

import lombok.Data;

@Data
public class AiSettingsRequest {
    private String provider;
    private String model;
    private String apiKey;
    private Boolean enabled;
    private String defaultModel;
}
