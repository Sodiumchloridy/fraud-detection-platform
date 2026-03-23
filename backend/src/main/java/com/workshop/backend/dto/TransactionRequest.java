package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionRequest {
    private String cardNumber;
    private Double amount;
    private String category;
    private Double latitude;
    private Double longitude;
    private String channel;
    private String merchant;

    @JsonAlias("device_id")
    private String deviceId;

    private String cardNetwork;
    private String cardType;
    private String billingCountry;
    private String emailDomain;
    private String deviceType;
    private String timestamp;
}