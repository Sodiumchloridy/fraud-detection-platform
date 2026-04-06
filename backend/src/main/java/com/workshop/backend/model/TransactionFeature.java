package com.workshop.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.util.UUID;

@Entity
@Table(name = "transaction_features")
@Data
public class TransactionFeature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "transaction_id", referencedColumnName = "id")
    @JsonIgnore
    @lombok.ToString.Exclude
    private Transaction transaction;

    /* Fraud Features */
    private Double amountZscore;
    private Double amountToAvgRatio;
    private Integer txnCount1h;
    private Integer txnCount24h;
    private Integer txnCount7d;
    private Double amtCents;
    private Double dayOfWeek;
    private Double amtSum1h;
    private Double amtSum24h;
    private Double amtSum7d;
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
}
