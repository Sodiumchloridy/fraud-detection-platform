package com.workshop.backend.controller;

import com.workshop.backend.dto.CreateUserRequest;
import com.workshop.backend.dto.UpdateUserRequest;
import com.workshop.backend.dto.UserResponse;
import com.workshop.backend.model.Role;
import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

/**
 * REST API Controller for User Management
 * Secured: ADMIN role only (configured in SecurityConfig)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    /**
     * GET all users (admin only)
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll().stream()
            .map(this::toResponse)
            .toList());
    }

    /**
     * POST create user (admin only)
     */
    @PostMapping
    public ResponseEntity<UserResponse> createUser(@RequestBody CreateUserRequest request) {
        validateCreateRequest(request);

        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmail(request.getEmail().trim());
        user.setRole(parseRole(request.getRole()));
        user.setEnabled(request.getEnabled() == null || request.getEnabled());

        User saved = userRepository.save(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /**
     * PUT update user fields (admin only)
     */
    @PutMapping("/{id}")
    public ResponseEntity<UserResponse> updateUser(@PathVariable Long id, @RequestBody UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Optional.ofNullable(request.getEmail()).filter(s -> !s.isBlank()).map(String::trim).ifPresent(user::setEmail);
        Optional.ofNullable(request.getRole()).filter(s -> !s.isBlank()).map(this::parseRole).ifPresent(user::setRole);
        Optional.ofNullable(request.getEnabled()).ifPresent(user::setEnabled);
        Optional.ofNullable(request.getPassword()).filter(s -> !s.isBlank()).map(passwordEncoder::encode).ifPresent(user::setPassword);

        User updated = userRepository.save(user);
        return ResponseEntity.ok(toResponse(updated));
    }

    /**
     * DELETE user (admin only)
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private void validateCreateRequest(CreateUserRequest request) {
        requireNonBlank(request.getUsername(), "Username");
        requireNonBlank(request.getPassword(), "Password");
        requireNonBlank(request.getEmail(), "Email");
        requireNonBlank(request.getRole(), "Role");
    }

    private void requireNonBlank(String value, String fieldName) {
        if (value == null || value.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " is required");
    }

    private Role parseRole(String role) {
        try {
            return Role.valueOf(role.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role. Allowed values: ADMIN, ANALYST");
        }
    }

    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getRole().name(),
            user.isEnabled()
        );
    }
}
