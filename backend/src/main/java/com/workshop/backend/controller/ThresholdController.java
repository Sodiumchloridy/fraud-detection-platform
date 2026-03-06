package com.workshop.backend.controller;

import com.workshop.backend.config.ThresholdConfig;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/thresholds")
@RequiredArgsConstructor
public class ThresholdController {

    private final ThresholdConfig thresholdConfig;

    @GetMapping
    public ResponseEntity<Map<String, Double>> getThresholds() {
        return ResponseEntity.ok(Map.of(
            "blockedThreshold", thresholdConfig.getBlockedThreshold(),
            "flaggedThreshold", thresholdConfig.getFlaggedThreshold()
        ));
    }

    @PutMapping
    public ResponseEntity<Map<String, Double>> updateThresholds(@RequestBody Map<String, Double> body) {
        double blocked = body.getOrDefault("blockedThreshold", thresholdConfig.getBlockedThreshold());
        double flagged = body.getOrDefault("flaggedThreshold", thresholdConfig.getFlaggedThreshold());

        // Validate: flagged < blocked, both in 0-1 range
        if (flagged < 0 || flagged > 1 || blocked < 0 || blocked > 1) {
            return ResponseEntity.badRequest().build();
        }
        if (flagged >= blocked) {
            return ResponseEntity.badRequest().build();
        }

        thresholdConfig.setBlockedThreshold(blocked);
        thresholdConfig.setFlaggedThreshold(flagged);

        return ResponseEntity.ok(Map.of(
            "blockedThreshold", thresholdConfig.getBlockedThreshold(),
            "flaggedThreshold", thresholdConfig.getFlaggedThreshold()
        ));
    }
}
