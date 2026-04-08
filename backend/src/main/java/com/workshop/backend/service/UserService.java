package com.workshop.backend.service;

import com.workshop.backend.dto.CreateUserRequest;
import com.workshop.backend.dto.UpdateUserRequest;
import com.workshop.backend.dto.UserResponse;
import com.workshop.backend.enums.Role;
import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public List<UserResponse> findAll() {
        return userRepository.findAll().stream()
            .map(this::toResponse)
            .toList();
    }

    public UserResponse create(CreateUserRequest request) {
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

        return toResponse(userRepository.save(user));
    }

    public UserResponse update(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Optional.ofNullable(request.getEmail()).filter(s -> !s.isBlank()).map(String::trim).ifPresent(user::setEmail);
        Optional.ofNullable(request.getRole()).filter(s -> !s.isBlank()).map(this::parseRole).ifPresent(user::setRole);
        Optional.ofNullable(request.getEnabled()).ifPresent(user::setEnabled);
        Optional.ofNullable(request.getPassword()).filter(s -> !s.isBlank()).map(passwordEncoder::encode).ifPresent(user::setPassword);
        Optional.ofNullable(request.getPromptChangePassword()).ifPresent(user::setPromptChangePassword);

        return toResponse(userRepository.save(user));
    }

    public void delete(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        if ("admin".equalsIgnoreCase(user.getUsername())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "The root admin account cannot be deleted");
        }
        userRepository.deleteById(id);
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
            user.isEnabled(),
            user.isPromptChangePassword()
        );
    }
}
