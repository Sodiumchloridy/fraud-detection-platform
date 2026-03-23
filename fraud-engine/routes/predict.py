from fastapi import APIRouter
import os
import pandas as pd
from xgboost import XGBClassifier, DMatrix
import lightgbm as lgb
import time

from schemas import PredictRequest, PredictResponse, ModelScore, parse_ts
from features import compute_features
from rules import apply_rules
from explainability import compute_shap_values

router = APIRouter()

model = XGBClassifier(enable_categorical=True)
model.load_model("xgboost.json")

# Load LightGBM model if available
lgbm_model = None
try:
    if os.path.exists("model/lightgbm_model.txt"):
        lgbm_model = lgb.Booster(model_file="model/lightgbm_model.txt")
except Exception as e:
    print(f"Warning: Could not load LightGBM model: {e}")

FEATURE_ORDER = [
    'amt', 'category', 'channel',
    'amount_zscore', 'amount_to_avg_ratio',
    'travel_velocity_kmh', 'travel_distance_km',
    'txn_count_1h', 'txn_count_24h', 'txn_count_7d',
    'seconds_since_last_txn', 'hour_of_day',
    'is_new_device', 'is_new_merchant'
]

FEATURE_TYPES = ['float', 'c', 'c'] + ['float'] * 11


LGBM_FEATURE_ORDER = [
    'TransactionAmt', 'ProductCD', 'card1', 'card4', 'card6', 
    'addr2', 'P_emaildomain', 'R_emaildomain', 'DeviceType', 'DeviceInfo',
    'hour_of_day', 'amt_log', 'seconds_since_last_txn', 'amount_to_avg_ratio', 'amount_zscore'
]

@router.post("/predict", response_model=PredictResponse)
def predict_fraud(req: PredictRequest):
    txn = req.transaction
    curr_time = (parse_ts(txn.timestamp).timestamp()
                 if txn.timestamp else time.time())

    features = compute_features(txn, curr_time, req.history)

    input_df = pd.DataFrame([features])[FEATURE_ORDER]
    dmatrix = DMatrix(input_df, enable_categorical=True,
                          feature_names=FEATURE_ORDER, feature_types=FEATURE_TYPES)
    ml_score = float(model.get_booster().predict(dmatrix)[0])
    
    model_scores = [ModelScore(model_name="xgboost", score=ml_score)]
    
    # Optional LightGBM prediction if model is loaded and compatible
    if lgbm_model is not None:
        try:
            import numpy as np

            # Map FYP schema to exactly what LightGBM wants
            lgbm_req_data = {
                'TransactionAmt': float(features.get('amt', 0.0)),
                'ProductCD': 1,  # Safe default category ID for LightGBM
                'card1': abs(hash(txn.card_number)) % 10000 + 1 if txn.card_number else 1,
                'card4': 1,
                'card6': 1,
                'addr2': 1,
                'P_emaildomain': 1,
                'R_emaildomain': 1,
                'DeviceType': 1,
                'DeviceInfo': 1,
                'hour_of_day': float(features.get('hour_of_day', 0.0)),
                'amt_log': float(np.log1p(features.get('amt', 0.0))),
                'seconds_since_last_txn': float(features.get('seconds_since_last_txn', 99999999.0)),
                'amount_to_avg_ratio': float(features.get('amount_to_avg_ratio', 1.0)),
                'amount_zscore': float(features.get('amount_zscore', 0.0))
            }
            lgbm_req = pd.DataFrame([lgbm_req_data])

            # Strict parsing for LGBM requirements
            cat_cols = ['ProductCD', 'card1', 'card4', 'card6', 'addr2', 'P_emaildomain', 'R_emaildomain', 'DeviceType', 'DeviceInfo']
            float_cols = ['TransactionAmt', 'hour_of_day', 'amt_log', 'seconds_since_last_txn', 'amount_to_avg_ratio', 'amount_zscore']

            for c in cat_cols:
                lgbm_req[c] = lgbm_req[c].astype(np.int32)
            for c in float_cols:
                lgbm_req[c] = lgbm_req[c].astype(np.float32)

            # Predict
            lgbm_score = float(lgbm_model.predict(lgbm_req[LGBM_FEATURE_ORDER])[0])
            model_scores.append(ModelScore(model_name="lightgbm", score=lgbm_score))
        except Exception as e:
            print(f"Warning: LightGBM predict failed: {e}")

    fraud_prob, triggered_rules = apply_rules(features, ml_score)

    shap_explanation = compute_shap_values(model, input_df, FEATURE_ORDER)

    return PredictResponse(
        fraud_probability=fraud_prob,
        is_fraud=fraud_prob > 0.5,
        features=features,
        triggered_rules=triggered_rules,
        shap=shap_explanation,
        model_scores=model_scores,
    )
