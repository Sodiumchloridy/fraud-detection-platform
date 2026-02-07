from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
from xgboost import XGBClassifier
import time

app = FastAPI() # To run: uvicorn main:app --reload --port 8000
model = XGBClassifier(enable_categorical=True)
model.load_model("model.json")
user_memory = {}
MAX_USERS_IN_MEMORY = 10000  # Prevent unbounded memory growth

# Category list (must match the training data's categorical values exactly)
VALID_CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net',
    'grocery_pos', 'health_fitness', 'home', 'kids_pets',
    'misc_net', 'misc_pos', 'personal_care', 'shopping_net',
    'shopping_pos', 'travel'
]

def haversine_single(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    c = 2 * np.arcsin(np.sqrt(a)) 
    return c * 6371 

class Transaction(BaseModel):
    cc_number: str
    amount: float
    category: str
    latitude: float
    longitude: float

@app.post("/predict")
def predict_fraud(txn: Transaction):
    curr_time = time.time()
    
    # Prevent memory overflow
    if txn.cc_number not in user_memory and len(user_memory) >= MAX_USERS_IN_MEMORY:
        oldest_user = next(iter(user_memory))
        del user_memory[oldest_user]
    
    if txn.cc_number not in user_memory:
        user_memory[txn.cc_number] = {'lat': txn.latitude, 'long': txn.longitude, 'history': [curr_time]}
        dist_diff = 0.0
        time_diff = 0.0
        velocity = 0.0
        freq_1h = 1
    else:
        state = user_memory[txn.cc_number]
        
        # Velocity
        dist_diff = haversine_single(state['lat'], state['long'], txn.latitude, txn.longitude)
        time_diff = (curr_time - state['history'][-1]) / 3600
        velocity = (999999.0 if dist_diff > 0 else 0.0) if time_diff < 0.0001 else dist_diff / time_diff
        
        # Frequency (Burst Check)
        cutoff = curr_time - 3600
        new_history = [t for t in state['history'] if t > cutoff]
        new_history.append(curr_time)
        freq_1h = len(new_history)
        
        # Update State
        user_memory[txn.cc_number] = {'lat': txn.latitude, 'long': txn.longitude, 'history': new_history}

    # Build DataFrame using only numeric types to avoid string conversion issues
    # The 'category' is mapped to its integer code (alphabetical order)
    cat_mapping = {cat: i for i, cat in enumerate(VALID_CATEGORIES)}
    cat_code = cat_mapping.get(txn.category, 0)
    
    feature_order = ['amt', 'category', 'merch_lat', 'merch_long', 'dist_diff', 'time_diff', 'velocity', 'freq_1h']
    input_data = pd.DataFrame({
        'amt': [float(txn.amount)],
        'category': [int(cat_code)],
        'merch_lat': [float(txn.latitude)],
        'merch_long': [float(txn.longitude)],
        'dist_diff': [float(dist_diff)],
        'time_diff': [float(time_diff)],
        'velocity': [float(velocity)],
        'freq_1h': [float(freq_1h)]
    })[feature_order]
    
    # Explicitly set feature types and names so the booster
    # recognises column 'category' as categorical (integer-coded)
    feature_types = ['float', 'c', 'float', 'float', 'float', 'float', 'float', 'float']
    dmatrix = xgb.DMatrix(
        input_data,
        enable_categorical=True,
        feature_names=feature_order,
        feature_types=feature_types,
    )
    ml_score = float(model.get_booster().predict(dmatrix)[0])

    # ── Hybrid scoring: rule-based adjustments ──────────────────────
    # The ML model (trained on Sparkov) is strong on category+amount
    # patterns but weak on velocity/frequency anomalies.
    # Layer deterministic rules to catch what the model misses.
    
    rule_flags = []
    rule_boost = 0.0
    
    # Rule 1 — Impossible travel (velocity > speed of a commercial jet ~900 km/h)
    if velocity > 900:
        rule_boost += 0.4
        rule_flags.append(f"impossible_velocity({velocity:.0f}km/h)")
    
    # Rule 2 — Rapid-fire transactions (>4 in one hour)
    if freq_1h > 4:
        rule_boost += 0.25
        rule_flags.append(f"burst({freq_1h}_in_1h)")
    
    # Rule 3 — High amount in risky online channel
    if txn.amount > 500 and txn.category in ('misc_net', 'shopping_net', 'grocery_net'):
        rule_boost += 0.15
        rule_flags.append(f"high_amt_online(${txn.amount:.0f})")
    
    # Combine: ML score + rule boost, capped at 1.0
    # Uses max(ml, combined) so rules can only INCREASE risk, never lower it
    combined = min(ml_score + rule_boost, 1.0)
    final_score = max(ml_score, combined)
    
    print(f"Velocity: {velocity:.2f} km/h | Freq(1h): {freq_1h} | "
          f"ML: {ml_score:.6f} | Rules: +{rule_boost:.2f} {rule_flags} | "
          f"Final: {final_score:.6f}")
    
    return {
        "fraud_probability": final_score,
        "ml_score": ml_score,
        "rule_boost": rule_boost,
        "rule_flags": rule_flags,
        "velocity_kmh": velocity,
        "frequency_1h": freq_1h,
        "is_fraud": final_score > 0.5
    }