package com.workshop.backend.dto;

import lombok.Data;

@Data
public class TransactionDto {
    private String cc_number;  // Credit card number
    private Double amount;     // Transaction amount
    private String category;   // Transaction category
    private Double latitude;   // Location latitude
    private Double longitude;  // Location longitude
}