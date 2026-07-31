package com.workshop.backend.dto;

import lombok.Data;

@Data
public class FraudPredictionResponse {
    private Double fraudProbability;
    private TransactionFeatures features;
    private ShapExplanationResponse shap;
}

