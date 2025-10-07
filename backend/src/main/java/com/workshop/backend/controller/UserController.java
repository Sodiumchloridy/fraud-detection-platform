package com.workshop.backend.controller;

import com.workshop.backend.exception.InvalidRequestException;
import com.workshop.backend.exception.ResourceNotFoundException;
import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * FEATURE 1 & 2: REST API Controller for User Management
 * Provides endpoints for user CRUD operations and authentication
 */
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "http://localhost:4200")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    /**
     * FEATURE 1: GET endpoint to retrieve all users
     * FEATURE 2: @GetMapping for HTTP GET requests
     * URL: GET /api/users
     */
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll();
        return ResponseEntity.ok(users);
    }

    /**
     * FEATURE 1: GET endpoint with path variable
     * FEATURE 2: @PathVariable to extract user ID from URL
     * URL: GET /api/users/1
     */
    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        return ResponseEntity.ok(user);
    }

    /**
     * FEATURE 1: GET endpoint with path variable (username)
     * FEATURE 5: Uses derived query method findByUsername
     * URL: GET /api/users/username/admin
     */
    @GetMapping("/username/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResourceNotFoundException("User not found with username: " + username));
        return ResponseEntity.ok(user);
    }

    /**
     * FEATURE 1: GET endpoint with query parameter for filtering by role
     * FEATURE 5: Uses derived query method findByRole
     * URL: GET /api/users/by-role?role=ADMIN
     */
    @GetMapping("/by-role")
    public ResponseEntity<List<User>> getUsersByRole(@RequestParam String role) {
        // FEATURE 5: Using derived query
        List<User> users = userRepository.findByRole(role);
        return ResponseEntity.ok(users);
    }

    /**
     * FEATURE 1: GET endpoint with multiple query parameters
     * FEATURE 5: Uses derived query with multiple conditions
     * URL: GET /api/users/active?role=ANALYST&enabled=true
     */
    @GetMapping("/active")
    public ResponseEntity<List<User>> getActiveUsersByRole(
            @RequestParam String role,
            @RequestParam(defaultValue = "true") boolean enabled) {
        
        // FEATURE 5: Using derived query with AND condition
        List<User> users = userRepository.findByRoleAndEnabled(role, enabled);
        return ResponseEntity.ok(users);
    }

    /**
     * FEATURE 1: GET endpoint for finding users by email domain
     * FEATURE 5: Uses JPQL query with LIKE operator
     * URL: GET /api/users/by-domain?domain=fraudguard.com
     */
    @GetMapping("/by-domain")
    public ResponseEntity<List<User>> getUsersByEmailDomain(@RequestParam String domain) {
        // FEATURE 5: Using JPQL query
        List<User> users = userRepository.findByEmailDomain(domain);
        return ResponseEntity.ok(users);
    }

    /**
     * FEATURE 1: GET endpoint for admin users
     * FEATURE 5: Uses native SQL query
     * URL: GET /api/users/admins
     */
    @GetMapping("/admins")
    public ResponseEntity<List<User>> getActiveAdmins() {
        // FEATURE 5: Using native SQL query
        List<User> admins = userRepository.findActiveAdmins();
        return ResponseEntity.ok(admins);
    }

    /**
     * FEATURE 1: POST endpoint for user authentication/login
     * URL: POST /api/users/login
     * Body: { "username": "admin", "password": "admin123" }
     */
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String username = credentials.get("username");
        String password = credentials.get("password");
        
        // FEATURE 6: Validate input
        if (username == null || username.trim().isEmpty()) {
            throw new InvalidRequestException("Username is required");
        }
        if (password == null || password.trim().isEmpty()) {
            throw new InvalidRequestException("Password is required");
        }
        
        // FEATURE 5: Using derived query
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

    /**
     * FEATURE 1: POST endpoint to create a new user
     * FEATURE 4: Uses repository.save() for CREATE operation
     * URL: POST /api/users
     * Body: JSON with user data
     */
    @PostMapping
    public ResponseEntity<User> createUser(@RequestBody User user) {
        // FEATURE 6: Validate input
        if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
            throw new InvalidRequestException("Username is required");
        }
        if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
            throw new InvalidRequestException("Password is required");
        }
        if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
            throw new InvalidRequestException("Email is required");
        }
        
        // FEATURE 5: Check if username already exists using derived query
        if (userRepository.existsByUsername(user.getUsername())) {
            throw new InvalidRequestException("Username already exists: " + user.getUsername());
        }
        
        // Set defaults
        if (user.getRole() == null) {
            user.setRole("USER");
        }
        
        // FEATURE 4: CRUD - Create operation
        User savedUser = userRepository.save(user);
        return new ResponseEntity<>(savedUser, HttpStatus.CREATED);
    }

    /**
     * FEATURE 1: PUT endpoint to update user details
     * FEATURE 4: Uses repository.save() for UPDATE operation
     * URL: PUT /api/users/1
     */
    @PutMapping("/{id}")
    public ResponseEntity<User> updateUser(
            @PathVariable Long id,
            @RequestBody User userDetails) {
        
        // FEATURE 4: CRUD - Read operation
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        // Update fields (only if provided)
        if (userDetails.getUsername() != null) {
            // Check if new username is already taken by another user
            if (userRepository.existsByUsername(userDetails.getUsername()) && 
                !user.getUsername().equals(userDetails.getUsername())) {
                throw new InvalidRequestException("Username already exists: " + userDetails.getUsername());
            }
            user.setUsername(userDetails.getUsername());
        }
        if (userDetails.getEmail() != null) {
            user.setEmail(userDetails.getEmail());
        }
        if (userDetails.getPassword() != null) {
            user.setPassword(userDetails.getPassword());
        }
        if (userDetails.getRole() != null) {
            user.setRole(userDetails.getRole());
        }
        user.setEnabled(userDetails.isEnabled());
        
        // FEATURE 4: CRUD - Update operation
        User updatedUser = userRepository.save(user);
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * FEATURE 1: DELETE endpoint to remove a user
     * FEATURE 4: Uses repository.deleteById() for DELETE operation
     * URL: DELETE /api/users/1
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteUser(@PathVariable Long id) {
        // FEATURE 4: CRUD - Verify existence
        if (!userRepository.existsById(id)) {
            throw new ResourceNotFoundException("User", id);
        }
        
        // FEATURE 4: CRUD - Delete operation
        userRepository.deleteById(id);
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "User deleted successfully");
        response.put("id", id.toString());
        
        return ResponseEntity.ok(response);
    }

    /**
     * FEATURE 1: PATCH endpoint to toggle user enabled status
     * URL: PATCH /api/users/1/toggle-status
     */
    @PatchMapping("/{id}/toggle-status")
    public ResponseEntity<User> toggleUserStatus(@PathVariable Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User", id));
        
        user.setEnabled(!user.isEnabled());
        User updatedUser = userRepository.save(user);
        
        return ResponseEntity.ok(updatedUser);
    }

    /**
     * FEATURE 1: GET endpoint to check if username exists
     * URL: GET /api/users/check-username?username=admin
     */
    @GetMapping("/check-username")
    public ResponseEntity<Map<String, Boolean>> checkUsernameExists(@RequestParam String username) {
        // FEATURE 5: Using derived query method
        boolean exists = userRepository.existsByUsername(username);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("exists", exists);
        
        return ResponseEntity.ok(response);
    }
}
