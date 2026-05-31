package com.terra.backend.entity;

import jakarta.persistence.*;
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
}
