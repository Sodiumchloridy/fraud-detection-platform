package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FraudPredictionResponse {
    @JsonProperty("fraud_probability")
    private Double fraudProbability;

    @JsonProperty("is_fraud")
    private Boolean isFraud;

    @JsonProperty("features")
    private FraudFeaturesResponse features;

    @JsonProperty("shap")
    private ShapExplanationResponse shap;
}
