from fastapi import APIRouter
from datetime import datetime
import pandas as pd
import xgboost as xgb
import time
from xgboost import XGBClassifier

from models import Transaction
from features import compute_features, set_user_state, VELOCITY_BLOCK_THRESHOLD_KMH

router = APIRouter()

model = XGBClassifier(enable_categorical=True)
model.load_model("xgboost.json")

FEATURE_ORDER = [
    'amt', 'category', 'channel',
    'f_amount_zscore', 'f_amount_to_avg_ratio',
    'f_travel_velocity_kmh', 'f_travel_distance_km',
    'f_txn_count_1h', 'f_txn_count_24h', 'f_txn_count_7d',
    'f_seconds_since_last_txn', 'f_hour_of_day',
    'f_is_new_device', 'f_is_new_merchant'
]

FEATURE_TYPES = ['float', 'c', 'c'] + ['float'] * 11


@router.post("/predict")
def predict_fraud(txn: Transaction):
    curr_time = (datetime.fromisoformat(txn.timestamp.replace('Z', '+00:00')).timestamp()
                 if txn.timestamp else time.time())

    features, new_state = compute_features(txn, curr_time)
    set_user_state(txn.cc_number, new_state)

    if features['f_travel_velocity_kmh'] > VELOCITY_BLOCK_THRESHOLD_KMH:
        fraud_prob = 1.0
    else:
        input_df = pd.DataFrame([features])[FEATURE_ORDER]
        dmatrix = xgb.DMatrix(input_df, enable_categorical=True,
                              feature_names=FEATURE_ORDER, feature_types=FEATURE_TYPES)
        fraud_prob = float(model.get_booster().predict(dmatrix)[0])

    return {
        "fraud_probability": fraud_prob,
        "is_fraud": fraud_prob > 0.5,
        "features": features
    }
