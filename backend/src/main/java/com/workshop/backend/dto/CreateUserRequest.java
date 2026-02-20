package com.workshop.backend.dto;

import lombok.Data;

@Data
public class CreateUserRequest {
    private String username;
    private String password;
    private String email;
    private String role;
    private Boolean enabled;
}
