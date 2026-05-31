package com.terra.backend.dto.response;

import com.terra.backend.entity.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String role;
    private String status;

    public static AdminUserResponse fromEntity(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .build();
    }
}
