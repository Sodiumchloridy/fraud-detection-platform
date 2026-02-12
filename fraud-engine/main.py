from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import pandas as pd
import numpy as np
import xgboost as xgb
from xgboost import XGBClassifier
import time
from litellm import completion
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()
app = FastAPI() # uv run uvicorn main:app --reload

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:4200",
        "http://127.0.0.1:4200",
    ],
    allow_credentials=True,
    allow_methods=["*"] ,
    allow_headers=["*"],
)
model = XGBClassifier(enable_categorical=True)
model.load_model("xgboost.json")
user_memory = {}
MAX_USERS = 10000

VALID_CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net',
    'grocery_pos', 'health_fitness', 'home', 'kids_pets',
    'misc_net', 'misc_pos', 'personal_care', 'shopping_net',
    'shopping_pos', 'travel'
]

VALID_CHANNELS = ['in_store', 'online', 'atm']

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    return 2 * np.arcsin(np.sqrt(a)) * 6371

def get_user_state(cc_num: str) -> dict | None:
    return user_memory.get(cc_num)

def set_user_state(cc_num: str, state: dict):
    if cc_num not in user_memory and len(user_memory) >= MAX_USERS:
        del user_memory[next(iter(user_memory))]
    user_memory[cc_num] = state

class Transaction(BaseModel):
    cc_number: str
    amount: float
    category: str
    channel: str = 'in_store'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''
    timestamp: Optional[str] = None
    
    @property
    def local_hour_of_day(self) -> int:
        """Calculate hour in user's timezone based on longitude (rough estimate)"""
        if self.timestamp and self.longitude is not None:
            utc_dt = datetime.fromisoformat(self.timestamp.replace('Z', '+00:00'))
            tz_offset_hours = round(self.longitude / 15)
            local_hour = (utc_dt.hour + tz_offset_hours) % 24
            return local_hour
        return int((time.time() % 86400) // 3600)  # fallback to UTC

def compute_features(txn: Transaction, curr_time: float) -> tuple[dict, dict]:
    """Returns (features_dict, updated_state)"""
    
    state = get_user_state(txn.cc_number)
    
    if state is None:
        # First transaction for this user
        state = {
            'amounts': [],
            'timestamps': [],
            'lat': txn.latitude,
            'long': txn.longitude,
            'merchants': [],
            'devices': []
        }
    
    amounts = state['amounts']
    timestamps = state['timestamps']
    
    # ── Amount Features ──
    if len(amounts) > 0:
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts) if len(amounts) > 1 else 1.0
        f_amount_zscore = (txn.amount - mean_amt) / (std_amt if std_amt > 0 else 1.0)
        f_amount_to_avg_ratio = txn.amount / mean_amt if mean_amt > 0 else 1.0
    else:
        f_amount_zscore = 0.0
        f_amount_to_avg_ratio = 1.0
    
    # ── Velocity Features ──
    if timestamps:
        f_travel_distance_km = haversine(state['lat'], state['long'], txn.latitude, txn.longitude)
        f_seconds_since_last_txn = curr_time - timestamps[-1]
        hours_diff = f_seconds_since_last_txn / 3600
        f_travel_velocity_kmh = f_travel_distance_km / hours_diff if hours_diff > 0.0001 else 0.0
    else:
        f_travel_distance_km = 0.0
        f_seconds_since_last_txn = 0.0
        f_travel_velocity_kmh = 0.0
    
    # ── Frequency Features ──
    f_txn_count_1h = sum(1 for t in timestamps if curr_time - t <= 3600) + 1
    f_txn_count_24h = sum(1 for t in timestamps if curr_time - t <= 86400) + 1
    f_txn_count_7d = sum(1 for t in timestamps if curr_time - t <= 604800) + 1
    
    # ── Time Features ──
    # Use local hour based on transaction location for better fraud detection
    f_hour_of_day = txn.local_hour_of_day
    
    # ── Novelty Features ──
    f_is_new_merchant = 0 if txn.merchant in state['merchants'] else 1
    f_is_new_device = 0 if txn.device_id in state['devices'] else 1
    
    # ── Update State ──
    # Keep last 100 amounts, 7 days of timestamps
    cutoff_7d = curr_time - 604800
    new_state = {
        'amounts': (amounts + [txn.amount])[-100:],
        'timestamps': [t for t in timestamps if t > cutoff_7d] + [curr_time],
        'lat': txn.latitude,
        'long': txn.longitude,
        'merchants': list(set(state['merchants'] + [txn.merchant]))[-50:],
        'devices': list(set(state['devices'] + [txn.device_id]))[-10:]
    }
    
    features = {
        'amt': txn.amount,
        'category': VALID_CATEGORIES.index(txn.category) if txn.category in VALID_CATEGORIES else 0,
        'channel': VALID_CHANNELS.index(txn.channel) if txn.channel in VALID_CHANNELS else 0,
        'f_amount_zscore': f_amount_zscore,
        'f_amount_to_avg_ratio': f_amount_to_avg_ratio,
        'f_travel_velocity_kmh': f_travel_velocity_kmh,
        'f_travel_distance_km': f_travel_distance_km,
        'f_txn_count_1h': f_txn_count_1h,
        'f_txn_count_24h': f_txn_count_24h,
        'f_txn_count_7d': f_txn_count_7d,
        'f_seconds_since_last_txn': f_seconds_since_last_txn,
        'f_hour_of_day': f_hour_of_day,
        'f_is_new_device': f_is_new_device,
        'f_is_new_merchant': f_is_new_merchant
    }
    
    return features, new_state

@app.post("/predict")
def predict_fraud(txn: Transaction):
    if txn.timestamp is not None:
        curr_time = datetime.fromisoformat(txn.timestamp.replace('Z', '+00:00')).timestamp()
    else:
        curr_time = time.time()
    
    features, new_state = compute_features(txn, curr_time)
    set_user_state(txn.cc_number, new_state)
    
    feature_order = [
        'amt', 'category', 'channel',
        'f_amount_zscore', 'f_amount_to_avg_ratio',
        'f_travel_velocity_kmh', 'f_travel_distance_km',
        'f_txn_count_1h', 'f_txn_count_24h', 'f_txn_count_7d',
        'f_seconds_since_last_txn', 'f_hour_of_day',
        'f_is_new_device', 'f_is_new_merchant'
    ]
    
    input_df = pd.DataFrame([features])[feature_order]
    
    feature_types = ['float', 'c', 'c'] + ['float'] * 11
    dmatrix = xgb.DMatrix(
        input_df,
        enable_categorical=True,
        feature_names=feature_order,
        feature_types=feature_types
    )
    
    fraud_prob = float(model.get_booster().predict(dmatrix)[0])
    
    return {
        "fraud_probability": fraud_prob,
        "is_fraud": fraud_prob > 0.5,
        "features": features
    }

class TransactionAnalysisRequest(BaseModel):
    id: Optional[str] = None
    ccNumber: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    timestamp: Optional[str] = None
    merchant: Optional[str] = None
    channel: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    f_amount_zscore: Optional[float] = None
    f_amount_to_avg_ratio: Optional[float] = None
    f_travel_velocity_kmh: Optional[float] = None
    f_travel_distance_km: Optional[float] = None
    f_txn_count_1h: Optional[int] = None
    f_txn_count_24h: Optional[int] = None
    f_txn_count_7d: Optional[int] = None
    f_seconds_since_last_txn: Optional[float] = None
    f_hour_of_day: Optional[int] = None
    f_is_new_device: Optional[int] = None
    f_is_new_merchant: Optional[int] = None
    riskScore: Optional[float] = None
    status: Optional[str] = None

@app.post("/analyze-transaction")
def analyze_transaction(txn: TransactionAnalysisRequest):
    response = completion(
        model="cerebras/qwen-3-32b",
        messages=[{"role": "user", "content": f"""Analyze the following transaction for potential reasons why it was flagged as fraudulent.
        Reply in a short concise paragraph. Do not take the risk score and status into account.
        Transaction Details:
        {txn.model_dump_json()}"""}]
    )

    return { "reason": response.choices[0].message.content } # type: ignore