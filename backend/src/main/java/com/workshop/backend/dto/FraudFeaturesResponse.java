package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FraudFeaturesResponse {

    @JsonProperty("amountZscore")
    @JsonAlias("amount_zscore")
    private Double amountZscore;

    @JsonProperty("amountToAvgRatio")
    @JsonAlias("amount_to_avg_ratio")
    private Double amountToAvgRatio;

    @JsonProperty("travelVelocityKmh")
    @JsonAlias("travel_velocity_kmh")
    private Double travelVelocityKmh;

    @JsonProperty("travelDistanceKm")
    @JsonAlias("travel_distance_km")
    private Double travelDistanceKm;

    @JsonProperty("txnCount1h")
    @JsonAlias("txn_count_1h")
    private Integer txnCount1h;

    @JsonProperty("txnCount24h")
    @JsonAlias("txn_count_24h")
    private Integer txnCount24h;

    @JsonProperty("txnCount7d")
    @JsonAlias("txn_count_7d")
    private Integer txnCount7d;

    @JsonProperty("secondsSinceLastTxn")
    @JsonAlias("seconds_since_last_txn")
    private Double secondsSinceLastTxn;

    @JsonProperty("hourOfDay")
    @JsonAlias("hour_of_day")
    private Integer hourOfDay;

    @JsonProperty("isNewDevice")
    @JsonAlias("is_new_device")
    private Integer isNewDevice;

    @JsonProperty("isNewMerchant")
    @JsonAlias("is_new_merchant")
    private Integer isNewMerchant;
}
