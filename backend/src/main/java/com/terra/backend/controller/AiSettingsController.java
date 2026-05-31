package com.terra.backend.controller;

import com.terra.backend.dto.request.AiSettingsRequest;
import com.terra.backend.dto.response.AiSettingsResponse;
import com.terra.backend.service.AiSettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai/settings")
public class AiSettingsController {
    private final AiSettingsService service;

    public AiSettingsController(AiSettingsService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AiSettingsResponse> getSettings() {
        return ResponseEntity.ok(service.getSettings());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> updateSettings(@RequestBody AiSettingsRequest request) {
        service.updateSettings(request);
        return ResponseEntity.ok().build();
    }
}
