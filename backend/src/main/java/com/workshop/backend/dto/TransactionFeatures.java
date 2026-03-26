package com.workshop.backend.dto;

import com.fasterxml.jackson.databind.PropertyNamingStrategies;
import com.fasterxml.jackson.databind.annotation.JsonNaming;
import lombok.Data;

@Data
@JsonNaming(PropertyNamingStrategies.SnakeCaseStrategy.class)
public class TransactionFeatures {

    private Double amountZscore;
    private Double amountToAvgRatio;
    private Integer txnCount1h;
    private Integer txnCount24h;
    private Integer txnCount7d;
    private Double secondsSinceLastTxn;
    private Integer hourOfDay;
    private Double billingCountryMismatch;
    private Double isRiskyEmail;
    private Double emailDomainMismatch;
    private Double isNewEmail;
    private Double isNewDevice;
    private Double isNewMerchant;
}
