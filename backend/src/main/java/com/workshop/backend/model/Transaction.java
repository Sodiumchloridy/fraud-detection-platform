package com.workshop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Data // Lombok handles Getters/Setters
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // 1. Identity
    @Column(nullable = false)
    private String ccNum; // e.g., "user_123"

    // 2. Features for Model
    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String category; // e.g., "gas_transport"

    // 3. Spatio-Temporal Data (CRITICAL for Velocity)
    @Column(nullable = false)
    private Double latitude; 

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    // 4. The Verdict
    private Double riskScore; // 0.99
    
    private String status;    // "BLOCKED"
}