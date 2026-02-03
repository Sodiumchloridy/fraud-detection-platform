from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
import numpy as np
from xgboost import XGBClassifier
import time

app = FastAPI() # To run: uvicorn main:app --reload --port 8000
model = XGBClassifier()
model.load_model("model.json")
user_memory = {}
MAX_USERS_IN_MEMORY = 10000  # Prevent unbounded memory growth

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
    input_data = pd.DataFrame([{
        'amt': txn.amount,
        'category': txn.category,
        'merch_lat': txn.latitude,
        'merch_long': txn.longitude,
        'dist_diff': dist_diff,
        'time_diff': time_diff,
        'velocity': velocity,
        'freq_1h': freq_1h
    }])
    input_data['category'] = input_data['category'].astype('category')
    
    prob = float(model.predict_proba(input_data)[0][1])
    return {
        "fraud_probability": prob,
        "velocity_kmh": velocity,
        "frequency_1h": freq_1h,
        "is_fraud": prob > 0.5
    }