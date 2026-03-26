package com.workshop.backend.service;

import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import com.workshop.backend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;

    public Map<String, Object> login(String username, String password) {
        if (username == null || username.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username is required");
        if (password == null || password.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password is required");

        try {
            authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, password)
            );
        } catch (AuthenticationException e) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid username or password");
        }

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());

        return Map.of(
            "token", token,
            "userId", user.getId(),
            "username", user.getUsername(),
            "role", user.getRole().name(),
            "email", user.getEmail()
        );
    }
}
