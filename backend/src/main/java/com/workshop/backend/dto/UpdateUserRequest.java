package com.workshop.backend.dto;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String password;
    private String email;
    private String role;
    private Boolean enabled;
    private Boolean promptChangePassword;
}
