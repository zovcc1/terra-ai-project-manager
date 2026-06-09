package com.terra.backend.dto.request;

import com.terra.backend.entity.Role;
import com.terra.backend.entity.User.UserStatus;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AdminUpdateUserRequest {

    private String username;

    @Email
    private String email;

    @Size(min = 6, max = 100)
    private String password;

    private String fullName;

    private Role role;

    private UserStatus status;

    private String avatarUrl;

    private String bio;
}