package com.terra.backend.repository;

import com.terra.backend.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByNameIgnoreCase(String name);
}
