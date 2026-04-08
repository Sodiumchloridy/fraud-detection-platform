package com.workshop.backend.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.Data;

import com.workshop.backend.enums.Role;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true)
    private String username;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String password;

    private String email;

    @Enumerated(EnumType.STRING)
    private Role role;

    private boolean enabled = true;

    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private String twoFactorSecret;

    private boolean twoFactorEnabled = false;

    @Column(columnDefinition = "BOOLEAN DEFAULT FALSE")
    private boolean promptChangePassword = false;
}