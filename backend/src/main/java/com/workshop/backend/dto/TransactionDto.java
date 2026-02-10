package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
public class TransactionDto {
    
    @JsonProperty("cc_number")
    @JsonAlias("ccNumber")
    private String ccNumber;

    private Double amount;
    private String category;
    private Double latitude;
    private Double longitude;

    private String channel;
    private String merchant;

    @JsonProperty("device_id")
    @JsonAlias("deviceId")
    private String deviceId;
}