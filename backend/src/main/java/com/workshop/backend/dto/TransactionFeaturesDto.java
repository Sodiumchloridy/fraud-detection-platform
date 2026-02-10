package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

@Data
public class TransactionFeaturesDto {

    @JsonProperty("f_amount_zscore")
    private Double f_amount_zscore;

    @JsonProperty("f_amount_to_avg_ratio")
    private Double f_amount_to_avg_ratio;

    @JsonProperty("f_travel_velocity_kmh")
    private Double f_travel_velocity_kmh;

    @JsonProperty("f_travel_distance_km")
    private Double f_travel_distance_km;

    @JsonProperty("f_txn_count_1h")
    private Integer f_txn_count_1h;

    @JsonProperty("f_txn_count_24h")
    private Integer f_txn_count_24h;

    @JsonProperty("f_txn_count_7d")
    private Integer f_txn_count_7d;

    @JsonProperty("f_seconds_since_last_txn")
    private Double f_seconds_since_last_txn;

    @JsonProperty("f_hour_of_day")
    private Integer f_hour_of_day;

    @JsonProperty("f_is_new_device")
    private Integer f_is_new_device;

    @JsonProperty("f_is_new_merchant")
    private Integer f_is_new_merchant;
}
