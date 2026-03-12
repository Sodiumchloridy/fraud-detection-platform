from typing import Any

from .base import BaseSchema
from .transaction import Transaction, HistoricalTransaction


class PredictRequest(BaseSchema):
    transaction: Transaction
    history: list[HistoricalTransaction] = []

class ModelScore(BaseSchema):
    """Score produced by a single ML model (useful for ensembles)."""
    model_name: str
    score: float
    weight: float = 1.0


class ShapFeature(BaseSchema):
    feature: str
    label: str
    shap_value: float
    feature_value: Any = None


class ShapExplanation(BaseSchema):
    base_value: float
    shap_values: dict[str, float]
    top_features: list[ShapFeature]


class PredictResponse(BaseSchema):
    fraud_probability: float
    is_fraud: bool
    features: dict[str, Any]
    triggered_rules: list[str]
    shap: ShapExplanation
    model_scores: list[ModelScore] = []
