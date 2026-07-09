package com.terra.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

@Entity
@Table(name = "ai_settings")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSettings {
    @Id
    private Long id;

    private String provider;
    private String model;

    @Column(name = "api_key_encrypted")
    private String apiKeyEncrypted;

    private boolean enabled;

    private String defaultModel;

    @Column(name = "api_url")
    private String apiUrl;
}
