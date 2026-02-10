package com.workshop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Data
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /* Core Transaction Data */
    @Column(nullable = false)
    private String ccNumber;

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

    /* Location Data */
    private Double latitude;
    private Double longitude;

    /* Fraud Features */
    private Double f_amount_zscore;
    private Double f_amount_to_avg_ratio;

    private Double f_travel_velocity_kmh;
    private Double f_travel_distance_km;

    private Integer f_txn_count_1h;
    private Integer f_txn_count_24h;
    private Integer f_txn_count_7d;

    private Double f_seconds_since_last_txn;
    private Integer f_hour_of_day;

    private Integer f_is_new_device;
    private Integer f_is_new_merchant;

    /* System & Verdict */
    private Double riskScore;
    private String status;
}