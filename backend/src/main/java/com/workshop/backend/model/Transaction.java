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

    @Column(nullable = false)
    private String cardNumber;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    private String category;
    private String merchant;
    private String channel;
    private String cardNetwork;
    private String cardType;
    private Integer cardIssuingCountry;
    private Integer billingCountryCode;
    private Integer billingZipCode;
    private String purchaserEmailDomain;
    private String recipientEmailDomain;
    private String deviceType;
    private String deviceInfo;

    /* Location Data */
    private Double latitude;
    private Double longitude;

    /* Fraud Features */
    private Double amountZscore;
    private Double amountToAvgRatio;
    private Integer txnCount1h;
    private Integer txnCount24h;
    private Integer txnCount7d;
    private Double travelVelocityKmh;
    private Double travelDistanceKm;
    private Double secondsSinceLastTxn;
    private Integer hourOfDay;
    private Double billingCountryMismatch;
    private Double isRiskyEmail;
    private Double emailDomainMismatch;
    private Double isNewEmail;
    private Double isNewDevice;
    private Double isNewMerchant;

    /* System & Verdict */
    private Double riskScore;

    @Column(columnDefinition = "TEXT")
    private String shapJson;
    
    @Enumerated(EnumType.STRING)
    private TransactionStatus status;

    /* Human Review */
    private Integer isFraud;
    private String reviewedBy;
    private LocalDateTime reviewedAt;
}