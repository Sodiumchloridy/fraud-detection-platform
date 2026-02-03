package com.workshop.backend.dto;

import lombok.Data;

@Data
public class TransactionDto {
    private String cc_number;
    private float amount;
    private String category;
    private float latitude;
    private float longitude;
}