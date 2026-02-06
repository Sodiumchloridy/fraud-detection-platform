from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import xgboost as xgb
from xgboost import XGBClassifier
import time

app = FastAPI() # To run: uvicorn main:app --reload --port 8000
model = XGBClassifier()
model.load_model("model.json")
user_memory = {}
MAX_USERS_IN_MEMORY = 10000  # Prevent unbounded memory growth

# Category encoding (must match training data)
CATEGORY_ENCODING = {
    'entertainment': 0,
    'food_dining': 1,
    'gas_transport': 2,
    'grocery_net': 3,
    'grocery_pos': 4,
    'health_fitness': 5,
    'home': 6,
    'kids_pets': 7,
    'misc_net': 8,
    'misc_pos': 9,
    'personal_care': 10,
    'shopping_net': 11,
    'shopping_pos': 12,
    'travel': 13
}

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
        # Remove oldest user
        oldest_user = next(iter(user_memory))
        del user_memory[oldest_user]
    
    if txn.cc_number not in user_memory:
        user_memory[txn.cc_number] = {'lat': txn.latitude, 'long': txn.longitude, 'history': [curr_time]}
        dist_diff = 0
        time_diff = 0
        velocity = 0
        freq_1h = 1
    else:
        state = user_memory[txn.cc_number]
        
        # Velocity
        dist_diff = haversine_single(state['lat'], state['long'], txn.latitude, txn.longitude)
        time_diff = (curr_time - state['history'][-1]) / 3600
        velocity = (999999 if dist_diff > 0 else 0) if time_diff < 0.0001 else dist_diff / time_diff
        
        # Frequency (Burst Check)
        cutoff = curr_time - 3600
        new_history = [t for t in state['history'] if t > cutoff]
        new_history.append(curr_time)
        freq_1h = len(new_history)
        
        # Update State
        user_memory[txn.cc_number] = {'lat': txn.latitude, 'long': txn.longitude, 'history': new_history}

    # Must match XGBoost training columns exactly
    category_encoded = CATEGORY_ENCODING.get(txn.category, 0)
    feature_order = ['amt', 'category', 'merch_lat', 'merch_long', 'dist_diff', 'time_diff', 'velocity', 'freq_1h']
    input_data = pd.DataFrame([[
        float(txn.amount),
        float(category_encoded),
        float(txn.latitude),
        float(txn.longitude),
        float(dist_diff),
        float(time_diff),
        float(velocity),
        float(freq_1h)
    ]], columns=feature_order)
    
    prob = float(model.get_booster().predict(
        xgb.DMatrix(input_data, feature_names=feature_order)
    )[0])
    
    return {
        "fraud_probability": prob,
        "velocity_kmh": velocity,
        "frequency_1h": freq_1h,
        "is_fraud": prob > 0.5
    }