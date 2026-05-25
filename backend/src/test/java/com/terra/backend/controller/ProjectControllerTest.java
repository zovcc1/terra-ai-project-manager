package com.terra.backend.controller;

import static io.restassured.module.mockmvc.RestAssuredMockMvc.*;
import static org.hamcrest.Matchers.*;

import com.terra.backend.entity.Project;
import com.terra.backend.entity.Role;
import com.terra.backend.entity.User;
import com.terra.backend.repository.UserRepository;
import com.terra.backend.service.AuthorizationService;
import com.terra.backend.service.ProjectService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.Optional;

import static org.mockito.Mockito.when;

@WebMvcTest(ProjectController.class)
public class ProjectControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ProjectService projectService;

    @MockBean
    private AuthorizationService authorizationService;

    @MockBean
    private UserRepository userRepository;

    @BeforeEach
    public void setup() {
        mockMvc(mockMvc);
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void shouldReturnAllProjects() {
        Project p1 = new Project();
        p1.setId(1L);
        p1.setName("Test Project");

        when(projectService.getAllProjects()).thenReturn(Collections.singletonList(p1));

        given()
        .when()
            .get("/api/manager/projects")
        .then()
            .statusCode(200)
            .body("size()", is(1))
            .body("[0].name", is("Test Project"));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    public void shouldReturnProjectById() {
        Project p1 = new Project();
        p1.setId(1L);
        p1.setName("Test Project");

        User user = User.builder().id(1L).username("admin").role(Role.ADMIN).build();
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(user));
        when(projectService.getProjectById(1L)).thenReturn(p1);

        given()
        .when()
            .get("/api/manager/projects/1")
        .then()
            .statusCode(200)
            .body("name", is("Test Project"));
    }
}
