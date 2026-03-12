package com.workshop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

import com.workshop.backend.enums.TransactionStatus;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /* Core Transaction Data */
    @Column(nullable = false)
    private String cardNumber;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @Column(nullable = false)
    private String merchant;

    @Column(nullable = false)
    private String channel;

    private String deviceId;

    /* Location Data */
    private Double latitude;
    private Double longitude;

    /* Fraud Features */
    private Double fAmountZscore;
    private Double fAmountToAvgRatio;

    private Double fTravelVelocityKmh;
    private Double fTravelDistanceKm;

    private Integer fTxnCount1h;
    private Integer fTxnCount24h;
    private Integer fTxnCount7d;

    private Double fSecondsSinceLastTxn;
    private Integer fHourOfDay;

    private Integer fIsNewDevice;
    private Integer fIsNewMerchant;

    /* System & Verdict */
    private Double riskScore;

    @Column(length = 4000)
    private String shapJson;
    
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    /* Human Review */
    private Integer isFraud;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
}