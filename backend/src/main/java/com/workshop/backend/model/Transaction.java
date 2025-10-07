package com.workshop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * FEATURE 3: Domain class for Transaction entity
 * Maps to database table with JPA annotations
 */
@Entity
@Table(name = "transactions")
@Data
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String transactionId;
    private BigDecimal amount;
    private String type;
    private String description;
    private LocalDateTime timestamp;

    @Enumerated(EnumType.STRING)
    private RiskLevel riskLevel;

    private String status;
    
    private Integer fraudScore; // AI fraud detection score (0-100)

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}