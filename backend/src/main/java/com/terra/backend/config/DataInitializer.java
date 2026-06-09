package com.terra.backend.config;

import com.terra.backend.entity.*;
import com.terra.backend.repository.ProjectRepository;
import com.terra.backend.repository.TaskRepository;
import com.terra.backend.repository.TeamRepository;
import com.terra.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initDatabase(
            UserRepository userRepository,
            TeamRepository teamRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (userRepository.count() > 0) {
                return;
            }


            User admin = User.builder()
                    .username("admin")
                    .email("admin@terra.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .fullName("Admin User")
                    .role(Role.ADMIN)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            userRepository.save(admin);


            User manager = User.builder()
                    .username("manager")
                    .email("manager@terra.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .fullName("Manager One")
                    .role(Role.MANAGER)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            userRepository.save(manager);


            User member = User.builder()
                    .username("member")
                    .email("member@terra.com")
                    .passwordHash(passwordEncoder.encode("password"))
                    .fullName("Member One")
                    .role(Role.MEMBER)
                    .status(User.UserStatus.ACTIVE)
                    .build();
            userRepository.save(member);


            Team team = Team.builder()
                    .name("Core Team")
                    .description("Backend and Frontend development team")
                    .lead(manager)
                    .members(new HashSet<>(Set.of(manager, member)))
                    .build();
            teamRepository.save(team);


            Project project1 = Project.builder()
                    .name("Website Redesign")
                    .description("Modernize the landing page and dashboard")
                    .team(team)
                    .manager(manager)
                    .dueDate(LocalDate.now().plusMonths(2))
                    .priority(Project.Priority.HIGH)
                    .status(Project.ProjectStatus.ACTIVE)
                    .progress(45)
                    .build();
            projectRepository.save(project1);

            Project project2 = Project.builder()
                    .name("Mobile App V2")
                    .description("New version with AI features")
                    .team(team)
                    .manager(manager)
                    .dueDate(LocalDate.now().plusMonths(4))
                    .priority(Project.Priority.MEDIUM)
                    .status(Project.ProjectStatus.ACTIVE)
                    .progress(20)
                    .build();
            projectRepository.save(project2);


            Task task1 = Task.builder()
                    .title("Setup Database")
                    .description("Configure MariaDB and initial schema")
                    .project(project1)
                    .assignee(member)
                    .status(Task.TaskStatus.DONE)
                    .priority(Task.Priority.HIGH)
                    .dueDate(LocalDate.now().minusDays(2))
                    .build();
            taskRepository.save(task1);

            Task task2 = Task.builder()
                    .title("Develop API Endpoints")
                    .description("Create controllers and services for projects")
                    .project(project1)
                    .assignee(member)
                    .status(Task.TaskStatus.DOING)
                    .priority(Task.Priority.MEDIUM)
                    .dueDate(LocalDate.now().plusDays(10))
                    .build();
            taskRepository.save(task2);
        };
    }
}
