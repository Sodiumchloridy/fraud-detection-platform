package com.workshop.backend.config;

import lombok.Data;
import org.springframework.stereotype.Component;

@Data
@Component
public class ThresholdConfig {
    
    private double blockedThreshold = 0.50;
    private double flaggedThreshold = 0.18;
}
