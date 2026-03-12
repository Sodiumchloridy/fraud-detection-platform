package com.workshop.backend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.util.List;
import java.util.Map;

@Data
public class ShapExplanationResponse {

    @JsonProperty("baseValue")
    @JsonAlias("base_value")
    private Double baseValue;

    @JsonProperty("shapValues")
    @JsonAlias("shap_values")
    private Map<String, Double> shapValues;

    @JsonProperty("topFeatures")
    @JsonAlias("top_features")
    private List<ShapFeature> topFeatures;

    @Data
    public static class ShapFeature {
        private String feature;
        private String label;

        @JsonProperty("shapValue")
        @JsonAlias("shap_value")
        private Double shapValue;

        @JsonProperty("featureValue")
        @JsonAlias("feature_value")
        private Object featureValue;
    }
}
