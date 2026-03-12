package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FraudPredictionResponse {
    @JsonProperty("fraudProbability")
    @JsonAlias("fraud_probability")
    private Double fraudProbability;

    @JsonProperty("isFraud")
    @JsonAlias("is_fraud")
    private Boolean isFraud;

    private FraudFeaturesResponse features;

    private ShapExplanationResponse shap;
}
