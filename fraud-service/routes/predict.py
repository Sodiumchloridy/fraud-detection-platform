from fastapi import APIRouter
import os
import numpy as np
import lightgbm as lgb
import time

from schemas import (
    PredictRequest, PredictResponse, ModelScore,
    parse_ts,
)
from core.features import compute_features, prepare_model_input
from core.rules import apply_rules

router = APIRouter()

_dir = os.path.dirname(__file__)
_model_path = os.path.join(_dir, '..', 'models', 'lightgbm_model.txt')

model = lgb.Booster(model_file=_model_path)


@router.post("/predict", response_model=PredictResponse)
def predict_fraud(req: PredictRequest):
    txn = req.transaction
    curr_time = (parse_ts(txn.timestamp).timestamp()
                 if txn.timestamp else time.time())

    t0 = time.perf_counter()
    features = compute_features(txn, curr_time, req.history)
    t1 = time.perf_counter()

    input_df = prepare_model_input(features)
    raw_pred = model.predict(input_df)
    pred_array = np.asarray(raw_pred).flatten()
    ml_score = float(pred_array[0])
    # LightGBM Booster.predict returns raw score; clip to [0, 1]
    ml_score = max(0.0, min(1.0, ml_score))

    model_scores = [ModelScore(model_name="lightgbm", score=ml_score)]

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
