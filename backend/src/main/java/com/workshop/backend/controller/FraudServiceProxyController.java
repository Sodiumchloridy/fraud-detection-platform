package com.workshop.backend.controller;

import tools.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URI;
import java.util.List;
import java.util.Map;

/**
 * Proxies requests to the Python fraud-service so the frontend never
 * talks to the fraud-service directly.  Every call goes through Spring
 * Security (JWT) first, then is forwarded with an internal API key.
 */
@RestController
@RequestMapping("/api/fraud-service")
@RequiredArgsConstructor
public class FraudServiceProxyController {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;

    @Value("${fraud-service.base-url}")
    private String fraudServiceBaseUrl;

    @Value("${fraud-service.api-key}")
    private String fraudServiceApiKey;

    @PostMapping("/analyze")
    public Map<?, ?> analyzeTransaction(@RequestBody Map<String, Object> body) {
        return forward("/analyze-transaction", HttpMethod.POST, body, Map.class);
    }

    @PostMapping("/chat")
    public ResponseEntity<StreamingResponseBody> chat(@RequestBody Map<String, Object> body) {
        StreamingResponseBody stream = outputStream -> {
            HttpURLConnection conn = (HttpURLConnection) URI.create(fraudServiceBaseUrl + "/chat")
                    .toURL().openConnection();
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json");
            conn.setRequestProperty("X-API-Key", fraudServiceApiKey);
            conn.setDoOutput(true);

            objectMapper.writeValue(conn.getOutputStream(), body);

            try (InputStream is = conn.getInputStream()) {
                byte[] buffer = new byte[256];
                int n;
                while ((n = is.read(buffer)) != -1) {
                    outputStream.write(buffer, 0, n);
                    outputStream.flush();
                }
            } finally {
                conn.disconnect();
            }
        };

        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_EVENT_STREAM)
                .header("Cache-Control", "no-cache")
                .header("X-Accel-Buffering", "no")
                .body(stream);
    }

    @GetMapping("/rules")
    public List<?> getRules() {
        return forward("/rules", HttpMethod.GET, null, List.class);
    }

    @PutMapping("/rules")
    public List<?> updateRules(@RequestBody List<Map<String, Object>> body) {
        return forward("/rules", HttpMethod.PUT, body, List.class);
    }

    @GetMapping("/blocklist")
    public List<?> getBlocklist() {
        return forward("/blocklist", HttpMethod.GET, null, List.class);
    }

    @PutMapping("/blocklist")
    public List<?> updateBlocklist(@RequestBody Map<String, Object> body) {
        return forward("/blocklist", HttpMethod.PUT, body, List.class);
    }

    @GetMapping("/allowlist")
    public List<?> getAllowlist() {
        return forward("/allowlist", HttpMethod.GET, null, List.class);
    }

    @PutMapping("/allowlist")
    public List<?> updateAllowlist(@RequestBody Map<String, Object> body) {
        return forward("/allowlist", HttpMethod.PUT, body, List.class);
    }

    @GetMapping("/ai-scoring")
    public Map<?, ?> getAiScoring() {
        return forward("/ai-scoring", HttpMethod.GET, null, Map.class);
    }

    @PutMapping("/ai-scoring")
    public Map<?, ?> updateAiScoring(@RequestBody Map<String, Object> body) {
        return forward("/ai-scoring", HttpMethod.PUT, body, Map.class);
    }

    private <T> T forward(String path, HttpMethod method, Object body, Class<T> type) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", fraudServiceApiKey);
        return restTemplate.exchange(fraudServiceBaseUrl + path, method, new HttpEntity<>(body, headers), type).getBody();
    }
}
