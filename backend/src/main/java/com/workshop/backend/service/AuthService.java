package com.workshop.backend.service;

import com.workshop.backend.model.User;
import com.workshop.backend.repository.UserRepository;
import com.workshop.backend.security.JwtUtil;
import dev.samstevens.totp.code.CodeVerifier;
import dev.samstevens.totp.code.DefaultCodeGenerator;
import dev.samstevens.totp.code.DefaultCodeVerifier;
import dev.samstevens.totp.secret.DefaultSecretGenerator;
import dev.samstevens.totp.time.SystemTimeProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final String TOTP_ISSUER = "Fraud Copilot";

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(
        new DefaultCodeGenerator(), new SystemTimeProvider()
    );

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

        if (user.isTwoFactorEnabled()) {
            return Map.of(
                "twoFactorRequired", true,
                "preAuthToken", jwtUtil.generatePreAuthToken(user.getUsername())
            );
        }

        return fullLoginResponse(user);
    }

    public Map<String, Object> verify2fa(String preAuthToken, String code) {
        if (!jwtUtil.isTokenValid(preAuthToken) || !jwtUtil.isPreAuthToken(preAuthToken))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid or expired pre-auth token");

        String username = jwtUtil.extractUsername(preAuthToken);
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!codeVerifier.isValidCode(user.getTwoFactorSecret(), code))
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid verification code");

        return fullLoginResponse(user);
    }

    public Map<String, String> setup2fa(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        String secret = new DefaultSecretGenerator().generate();
        user.setTwoFactorSecret(secret);
        userRepository.save(user);

        String otpauthUri = buildOtpAuthUri(username, secret);
        return Map.of("secret", secret, "otpauthUri", otpauthUri);
    }

    public void confirm2fa(String username, String code) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (user.getTwoFactorSecret() == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Run 2FA setup first");

        if (!codeVerifier.isValidCode(user.getTwoFactorSecret(), code))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid verification code");

        user.setTwoFactorEnabled(true);
        userRepository.save(user);
    }

    public void disable2fa(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        user.setTwoFactorEnabled(false);
        user.setTwoFactorSecret(null);
        userRepository.save(user);
    }

    private Map<String, Object> fullLoginResponse(User user) {
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole().name());
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("userId", user.getId());
        response.put("username", user.getUsername());
        response.put("role", user.getRole().name());
        response.put("email", user.getEmail());
        response.put("twoFactorEnabled", user.isTwoFactorEnabled());
        response.put("promptChangePassword", user.isPromptChangePassword());
        return response;
    }

    private String buildOtpAuthUri(String username, String secret) {
        String label = encodeOtpAuthValue(TOTP_ISSUER + ":" + username);
        String issuer = encodeOtpAuthValue(TOTP_ISSUER);
        return "otpauth://totp/" + label + "?secret=" + secret + "&issuer=" + issuer;
    }

    private String encodeOtpAuthValue(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8).replace("+", "%20");
    }

    public void changePassword(String username, String credential, boolean useOtp, String newPassword) {
        if (newPassword == null || newPassword.length() < 8)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Password must be at least 8 characters");

        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (useOtp) {
            if (!user.isTwoFactorEnabled())
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "OTP is not enabled for this account");
            if (!codeVerifier.isValidCode(user.getTwoFactorSecret(), credential))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid OTP code");
        } else {
            if (!passwordEncoder.matches(credential, user.getPassword()))
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        user.setPromptChangePassword(false);
        userRepository.save(user);
    }
}
