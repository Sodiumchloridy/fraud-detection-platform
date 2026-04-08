package com.workshop.backend.controller;

import com.workshop.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        return ResponseEntity.ok(authService.login(
            credentials.get("username"),
            credentials.get("password")
        ));
    }

    @PostMapping("/verify-2fa")
    public ResponseEntity<Map<String, Object>> verify2fa(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(authService.verify2fa(body.get("token"), body.get("code")));
    }

    @GetMapping("/2fa/setup")
    public ResponseEntity<Map<String, String>> setup2fa(Authentication auth) {
        return ResponseEntity.ok(authService.setup2fa(auth.getName()));
    }

    @PostMapping("/2fa/confirm")
    public ResponseEntity<Void> confirm2fa(Authentication auth, @RequestBody Map<String, String> body) {
        authService.confirm2fa(auth.getName(), body.get("code"));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/2fa")
    public ResponseEntity<Void> disable2fa(Authentication auth) {
        authService.disable2fa(auth.getName());
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(Authentication auth, @RequestBody Map<String, String> body) {
        authService.changePassword(
            auth.getName(),
            body.get("credential"),
            Boolean.parseBoolean(body.getOrDefault("useOtp", "false")),
            body.get("newPassword")
        );
        return ResponseEntity.ok().build();
    }
}
