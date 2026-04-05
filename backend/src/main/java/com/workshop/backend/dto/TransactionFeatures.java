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
    private Double amtCents;
    private Double dayOfWeek;
    @JsonProperty("amt_sum_1h")
    private Double amtSum1h;
    @JsonProperty("amt_sum_24h")
    private Double amtSum24h;
    @JsonProperty("amt_sum_7d")
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
