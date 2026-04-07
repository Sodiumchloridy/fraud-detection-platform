from fastapi import APIRouter
import os
import numpy as np
from autogluon.tabular import TabularPredictor
import time

from schemas import (
    PredictRequest, PredictResponse, ModelScore,
    parse_ts,
)
from core.features import compute_features, prepare_model_input
from core.rules import apply_rules

router = APIRouter()

_dir = os.path.dirname(__file__)
_model_path = os.path.join(_dir, '..', 'models', 'ag_deployment_model')

model = TabularPredictor.load(path=_model_path)
_best_single_model = "CatBoost_FULL"
model.persist([_best_single_model])


@router.post("/predict", response_model=PredictResponse)
def predict_fraud(req: PredictRequest):
    txn = req.transaction
    curr_time = (parse_ts(txn.timestamp).timestamp()
                 if txn.timestamp else time.time())

    t0 = time.perf_counter()
    features = compute_features(txn, curr_time, req.history, req.precalculatedFeatures)
    t1 = time.perf_counter()

    input_df = prepare_model_input(features)
    y_prob = model.predict_proba(input_df, model=_best_single_model).iloc[:, 1]
    pred_array = np.asarray(y_prob).flatten()
    ml_score = float(pred_array[0])
    ml_score = max(0.0, min(1.0, ml_score))

    model_scores = [ModelScore(model_name="autogluon", score=ml_score)]

    fraud_prob, triggered_rules = apply_rules(features, ml_score)
    t2 = time.perf_counter()

    feature_ms = (t1 - t0) * 1000
    inference_ms = (t2 - t1) * 1000
    total_ms = (t2 - t0) * 1000
    print(f"Feature: {feature_ms:.2f} ms | Inference: {inference_ms:.2f} ms | Total: {total_ms:.2f} ms")

    return PredictResponse(
        fraud_probability=fraud_prob,
        is_fraud=fraud_prob > 0.5,
        features=features,
        triggered_rules=triggered_rules,
        shap=None,
        model_scores=model_scores,
    )
