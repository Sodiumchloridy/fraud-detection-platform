package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
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
    private String cardNetwork;
    private String cardType;
    private Integer cardIssuingCountry;
    private Integer billingCountryCode;
    private Integer billingZipCode;
    @JsonAlias("purchaser_email_domain")
    private String purchaserEmailDomain;
    @JsonAlias("recipient_email_domain")
    private String recipientEmailDomain;
    private String deviceType;
    private String deviceInfo;
    private String timestamp;
}