package com.workshop.backend.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class TransactionShapEvent {
    private UUID transactionId;
    private ShapExplanationResponse shap;
}
