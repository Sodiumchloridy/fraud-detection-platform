package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionRequest {

    @JsonProperty("cardNumber")
    @JsonAlias({"cc_number", "ccNumber"})
    private String cardNumber;

    private Double amount;
    private String category;
    private Double latitude;
    private Double longitude;

    private String channel;
    private String merchant;

    @JsonProperty("deviceId")
    @JsonAlias("device_id")
    private String deviceId;

    private String timestamp;
}