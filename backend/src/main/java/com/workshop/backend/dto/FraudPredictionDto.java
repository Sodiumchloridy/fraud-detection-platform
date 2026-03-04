package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FraudPredictionDto {
    @JsonProperty("fraud_probability")
    private Double fraudProbability;

    @JsonProperty("is_fraud")
    private Boolean isFraud;

    @JsonProperty("features")
    private TransactionFeaturesDto features;
}
