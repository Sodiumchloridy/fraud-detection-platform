from fastapi import APIRouter
import os
import numpy as np
import lightgbm as lgb
import time

from schemas import (
    PredictRequest, PredictResponse, ModelScore,
    parse_ts,
)
from core.features import compute_features, MODEL_FEATURE_ORDER
from core.rules import apply_rules, is_blocked, is_allowlisted
from core.feature_store import calculate_features as redis_calculate_features, push_transaction
from core.model_artifacts import load_artifacts, encode_row

router = APIRouter()

_dir = os.path.dirname(__file__)
_model_dir = os.path.join(_dir, '..', 'models')

model = lgb.Booster(model_file=os.path.join(_model_dir, 'student_distilled.txt'))
_cat_lookups, _ = load_artifacts(os.path.join(_model_dir, 'inference_artifacts.json'))

_flagged_threshold = float(os.getenv('FRAUD_FLAGGED_THRESHOLD', '0.18'))
_blocked_threshold = float(os.getenv('FRAUD_BLOCKED_THRESHOLD', '0.50'))


@router.post("/predict", response_model=PredictResponse)
def predict_fraud(req: PredictRequest):
    txn = req.transaction

    if is_blocked(txn.card_number):
        return PredictResponse(
            fraud_probability=1.0,
            is_fraud=True,
            features={},
            triggered_rules=["card_blocklist"],
            shap=None,
            model_scores=[ModelScore(model_name="blocklist", score=1.0)],
        )

    if is_allowlisted(txn.card_number):
        return PredictResponse(
            fraud_probability=0.0,
            is_fraud=False,
            features={},
            triggered_rules=[],
            shap=None,
            model_scores=[ModelScore(model_name="allowlist", score=0.0)],
        )

    curr_time = (parse_ts(txn.timestamp).timestamp()
                 if txn.timestamp else time.time())

    current_ms = int(curr_time * 1000)
    precalc = redis_calculate_features(
        txn.card_number, txn.purchaser_email_domain, current_ms
    )

    t0 = time.perf_counter()
    features = compute_features(txn, curr_time, req.history, precalc)
    t1 = time.perf_counter()

    encoded = encode_row(features, MODEL_FEATURE_ORDER, _cat_lookups)
    ml_score = float(model.predict(encoded)[0])
    ml_score = max(0.0, min(1.0, ml_score))

    model_scores = [ModelScore(model_name="lightgbm_student", score=ml_score)]

    fraud_prob, triggered_rules = apply_rules(features, ml_score)
    t2 = time.perf_counter()

    feature_ms = (t1 - t0) * 1000
    inference_ms = (t2 - t1) * 1000
    total_ms = (t2 - t0) * 1000
    print(f"Feature: {feature_ms:.2f} ms | Inference: {inference_ms:.2f} ms | Total: {total_ms:.2f} ms")

    # Update Redis feature store with this transaction
    push_transaction(
        txn.card_number, txn.amount, current_ms,
        txn.purchaser_email_domain,
    )

    return PredictResponse(
        fraud_probability=fraud_prob,
        is_fraud=fraud_prob >= _flagged_threshold,
        features=features,
        triggered_rules=triggered_rules,
        shap=None,
        model_scores=model_scores,
    )
