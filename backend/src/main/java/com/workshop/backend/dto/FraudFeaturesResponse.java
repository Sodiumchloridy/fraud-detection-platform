package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class FraudFeaturesResponse {

    @JsonProperty("fAmountZscore")
    @JsonAlias("f_amount_zscore")
    private Double fAmountZscore;

    @JsonProperty("fAmountToAvgRatio")
    @JsonAlias("f_amount_to_avg_ratio")
    private Double fAmountToAvgRatio;

    @JsonProperty("fTravelVelocityKmh")
    @JsonAlias("f_travel_velocity_kmh")
    private Double fTravelVelocityKmh;

    @JsonProperty("fTravelDistanceKm")
    @JsonAlias("f_travel_distance_km")
    private Double fTravelDistanceKm;

    @JsonProperty("fTxnCount1h")
    @JsonAlias("f_txn_count_1h")
    private Integer fTxnCount1h;

    @JsonProperty("fTxnCount24h")
    @JsonAlias("f_txn_count_24h")
    private Integer fTxnCount24h;

    @JsonProperty("fTxnCount7d")
    @JsonAlias("f_txn_count_7d")
    private Integer fTxnCount7d;

    @JsonProperty("fSecondsSinceLastTxn")
    @JsonAlias("f_seconds_since_last_txn")
    private Double fSecondsSinceLastTxn;

    @JsonProperty("fHourOfDay")
    @JsonAlias("f_hour_of_day")
    private Integer fHourOfDay;

    @JsonProperty("fIsNewDevice")
    @JsonAlias("f_is_new_device")
    private Integer fIsNewDevice;

    @JsonProperty("fIsNewMerchant")
    @JsonAlias("f_is_new_merchant")
    private Integer fIsNewMerchant;
}
