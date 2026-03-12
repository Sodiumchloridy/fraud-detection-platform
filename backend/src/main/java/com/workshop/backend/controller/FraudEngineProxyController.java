package com.workshop.backend.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

/**
 * Proxies requests to the Python fraud-engine so the frontend never
 * talks to the fraud-engine directly.  Every call goes through Spring
 * Security (JWT) first, then is forwarded with an internal API key.
 */
@RestController
@RequestMapping("/api/fraud-engine")
@RequiredArgsConstructor
public class FraudEngineProxyController {

    private final RestTemplate restTemplate;

    @Value("${fraud-engine.base-url}")
    private String fraudEngineBaseUrl;

    @Value("${fraud-engine.api-key}")
    private String fraudEngineApiKey;

    @PostMapping("/analyze")
    public Map<?, ?> analyzeTransaction(@RequestBody Map<String, Object> body) {
        return forward("/analyze-transaction", HttpMethod.POST, body, Map.class);
    }

    @PostMapping("/chat")
    public Map<?, ?> chat(@RequestBody Map<String, Object> body) {
        return forward("/chat", HttpMethod.POST, body, Map.class);
    }

    @GetMapping("/rules")
    public List<?> getRules() {
        return forward("/rules", HttpMethod.GET, null, List.class);
    }

    @PutMapping("/rules")
    public List<?> updateRules(@RequestBody List<Map<String, Object>> body) {
        return forward("/rules", HttpMethod.PUT, body, List.class);
    }

    private <T> T forward(String path, HttpMethod method, Object body, Class<T> type) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("X-API-Key", fraudEngineApiKey);
        return restTemplate.exchange(fraudEngineBaseUrl + path, method, new HttpEntity<>(body, headers), type).getBody();
    }
}
