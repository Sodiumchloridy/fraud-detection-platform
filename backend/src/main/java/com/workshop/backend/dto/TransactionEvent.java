package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import com.workshop.backend.enums.TransactionStatus;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class TransactionEvent {
    private UUID id;
    private String cardNumber;
    private Double amount;
    private String category;
    private String merchant;
    private String channel;
    private String cardNetwork;
    private String cardType;
    private Integer cardIssuingCountry;
    private Integer billingCountryCode;
    private Integer billingZipCode;
    private String purchaserEmailDomain;
    private String recipientEmailDomain;
    private String deviceType;
    private String deviceInfo;
    private Double latitude;
    private Double longitude;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime timestamp;

    /* Features Mapping */
    @com.fasterxml.jackson.annotation.JsonUnwrapped
    private com.workshop.backend.model.TransactionFeature features;

    /* System & Verdict */
    private Double riskScore;
    private String shapJson;
    private TransactionStatus status;

    /* Human Review */
    private Integer markedFraud;
    private String reviewedBy;
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd'T'HH:mm:ss")
    private LocalDateTime reviewedAt;
}
