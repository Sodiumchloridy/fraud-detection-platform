package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ShapExplanationResponse {

    @JsonProperty("base_value")
    private Double baseValue;

    @JsonProperty("shap_values")
    private Map<String, Double> shapValues;

    @JsonProperty("top_features")
    private List<ShapFeature> topFeatures;

    @Data
    public static class ShapFeature {
        private String feature;
        private String label;

        @JsonProperty("shap_value")
        private Double shapValue;

        @JsonProperty("feature_value")
        private Object featureValue;
    }
}
