package com.terra.backend.repository;

import com.terra.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByManagerId(Long managerId);

    long countByStatus(Project.ProjectStatus status);


    boolean existsByIdAndManagerId(Long id, Long managerId);

    @Query("SELECT DISTINCT p FROM Project p " +
            "LEFT JOIN p.team t " +
            "LEFT JOIN t.members m " +
            "WHERE p.manager.id = :userId OR m.id = :userId")
    List<Project> findProjectsByUser(@Param("userId") Long userId);


}
