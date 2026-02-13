import numpy as np
from models import Transaction


MAX_USERS = 10000
VELOCITY_BLOCK_THRESHOLD_KMH = 1500.0

VALID_CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net',
    'grocery_pos', 'health_fitness', 'home', 'kids_pets',
    'misc_net', 'misc_pos', 'personal_care', 'shopping_net',
    'shopping_pos', 'travel'
]

VALID_CHANNELS = ['in_store', 'online', 'atm']

user_memory: dict[str, dict] = {}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * np.arcsin(np.sqrt(a)) * 6371


def set_user_state(cc_num: str, state: dict):
    if cc_num not in user_memory and len(user_memory) >= MAX_USERS:
        del user_memory[next(iter(user_memory))]
    user_memory[cc_num] = state


def compute_features(txn: Transaction, curr_time: float) -> tuple[dict, dict]:
    state = user_memory.get(txn.cc_number) or {
        'amounts': [], 'timestamps': [],
        'lat': txn.latitude, 'long': txn.longitude,
        'merchants': [], 'devices': []
    }

    amounts, timestamps = state['amounts'], state['timestamps']

    # Amount features
    if amounts:
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts) if len(amounts) > 1 else 1.0
        f_amount_zscore = (txn.amount - mean_amt) / (std_amt or 1.0)
        f_amount_to_avg_ratio = txn.amount / mean_amt if mean_amt else 1.0
    else:
        f_amount_zscore, f_amount_to_avg_ratio = 0.0, 1.0

    # Velocity features
    if timestamps:
        f_travel_distance_km = haversine(state['lat'], state['long'], txn.latitude, txn.longitude)  # type: ignore
        f_seconds_since_last_txn = curr_time - timestamps[-1]
        hours_diff = f_seconds_since_last_txn / 3600
        f_travel_velocity_kmh = f_travel_distance_km / hours_diff if hours_diff > 0.0001 else 0.0
    else:
        f_travel_distance_km = f_seconds_since_last_txn = f_travel_velocity_kmh = 0.0

    # Frequency features
    txn_counts = {w: sum(1 for t in timestamps if curr_time - t <= w) + 1
                  for w in (3600, 86400, 604800)}

    # Update state
    cutoff_7d = curr_time - 604800
    new_state = {
        'amounts': (amounts + [txn.amount])[-100:],
        'timestamps': [t for t in timestamps if t > cutoff_7d] + [curr_time],
        'lat': txn.latitude, 'long': txn.longitude,
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
        'f_txn_count_1h': txn_counts[3600],
        'f_txn_count_24h': txn_counts[86400],
        'f_txn_count_7d': txn_counts[604800],
        'f_seconds_since_last_txn': f_seconds_since_last_txn,
        'f_hour_of_day': txn.local_hour_of_day,
        'f_is_new_device': int(txn.device_id not in state['devices']),
        'f_is_new_merchant': int(txn.merchant not in state['merchants'])
    }

    return features, new_state
