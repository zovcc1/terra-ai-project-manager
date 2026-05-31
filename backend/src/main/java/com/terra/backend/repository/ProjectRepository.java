package com.terra.backend.repository;

import com.terra.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByManagerId(Long managerId);
    long countByStatus(Project.ProjectStatus status);
    // ProjectRepository.java
    boolean existsByIdAndManagerId(Long id, Long managerId);
    @Query("SELECT DISTINCT p FROM Project p LEFT JOIN p.tasks t WHERE p.manager.id = :userId OR t.assignee.id = :userId OR (p.team IS NOT NULL AND :userId IN (SELECT m.id FROM p.team.members m))")
    List<Project> findProjectsByUser(@Param("userId") Long userId);

}
