package com.terra.backend.repository;

import com.terra.backend.entity.AiSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AiSettingsRepository extends JpaRepository<AiSettings, Long> {
}
