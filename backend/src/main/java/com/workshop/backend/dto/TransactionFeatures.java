package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class TransactionFeatures {

    private Double amountZscore;
    private Double amountToAvgRatio;
    @JsonProperty("txn_count_1h")
    private Integer txnCount1h;
    @JsonProperty("txn_count_24h")
    private Integer txnCount24h;
    @JsonProperty("txn_count_7d")
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
}
