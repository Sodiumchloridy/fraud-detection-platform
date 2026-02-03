package com.workshop.backend.controller;

import com.workshop.backend.exception.InvalidRequestException;
import com.workshop.backend.exception.ResourceNotFoundException;
import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * REST API Controller for User Authentication
 * Simplified to support login functionality needed by frontend
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * POST endpoint for user login
     * Used by: LoginComponent
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // Input validation
        if (username == null || username.trim().isEmpty()) {
            throw new InvalidRequestException("Username is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new InvalidRequestException("Password is required");
        }
        
        // Derived query
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("Invalid username or password"));
        
        // Simple password check (in production, use proper password hashing)
        if (!user.getPassword().equals(password)) {
            throw new InvalidRequestException("Invalid username or password");
        }
        
        if (!user.isEnabled()) {
            throw new InvalidRequestException("User account is disabled");
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole());
        response.put("message", "Login successful");
        
        return ResponseEntity.ok(response);
    }
}
