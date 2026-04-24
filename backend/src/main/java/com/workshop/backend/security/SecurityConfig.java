package com.workshop.backend.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtUtil jwtUtil;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // 2FA management requires authentication
                .requestMatchers("/api/auth/2fa", "/api/auth/2fa/**").authenticated()
                // Password change requires authentication
                .requestMatchers("/api/auth/change-password").authenticated()
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()

                // Admin-only: update transaction status, manage users, update thresholds
                .requestMatchers(HttpMethod.PATCH, "/api/transactions/*/status").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/thresholds").hasRole("ADMIN")
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                // Fraud-service proxy: rules management is admin-only
                .requestMatchers(HttpMethod.PUT, "/api/fraud-service/rules").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/fraud-service/blocklist").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/fraud-service/allowlist").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/fraud-service/ai-scoring").hasRole("ADMIN")
                .requestMatchers("/api/fraud-service/**").hasAnyRole("ADMIN", "ANALYST")

                // SSE stream — allow with any role
                .requestMatchers("/api/transactions/stream").hasAnyRole("ADMIN", "ANALYST")

                // Authenticated endpoints (both ADMIN and ANALYST)
                .requestMatchers("/api/transactions/**").hasAnyRole("ADMIN", "ANALYST")
                .requestMatchers(HttpMethod.GET, "/api/thresholds").hasAnyRole("ADMIN", "ANALYST")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            // Allow H2 console iframe
            .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
            .addFilterBefore(new JwtAuthenticationFilter(jwtUtil), UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of(
            "http://localhost:*",
            "http://127.0.0.1:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return PasswordEncoderFactories.createDelegatingPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
