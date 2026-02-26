import numpy as np
from models import Transaction, HistoricalTxn, parse_ts


VELOCITY_BLOCK_THRESHOLD_KMH = 1500.0
VALID_CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net',
    'grocery_pos', 'health_fitness', 'home', 'kids_pets',
    'misc_net', 'misc_pos', 'personal_care', 'shopping_net',
    'shopping_pos', 'travel'
]
CATEGORY_INDEX = {c: i for i, c in enumerate(VALID_CATEGORIES)}
VALID_CHANNELS = ['in_store', 'online', 'atm']
CHANNEL_INDEX = {c: i for i, c in enumerate(VALID_CHANNELS)}


def haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * np.arcsin(np.sqrt(a)) * 6371


def compute_features(txn: Transaction, curr_time: float, history: list[HistoricalTxn]) -> dict:
    if history:
        amounts = [h.amount for h in history][-100:]
        timestamps = [parse_ts(h.timestamp).timestamp() for h in history]
        last = history[-1]
        merchants = list({h.merchant for h in history if h.merchant})
    else:
        amounts, timestamps, merchants = [], [], []
        last = None

    # Amount features
    if amounts:
        mean_amt = np.mean(amounts)
        std_amt = np.std(amounts) if len(amounts) > 1 else 1.0
        f_amount_zscore = (txn.amount - mean_amt) / (std_amt or 1.0)
        f_amount_to_avg_ratio = txn.amount / mean_amt if mean_amt else 1.0
    else:
        f_amount_zscore, f_amount_to_avg_ratio = 0.0, 1.0

    # Velocity features
    if last and timestamps:
        f_travel_distance_km = haversine(last.latitude, last.longitude, txn.latitude, txn.longitude)  # type: ignore
        f_seconds_since_last_txn = curr_time - timestamps[-1]
        f_travel_velocity_kmh = f_travel_distance_km * 3600 / f_seconds_since_last_txn if f_seconds_since_last_txn > 0.36 else 0.0
    else:
        f_travel_distance_km = f_seconds_since_last_txn = f_travel_velocity_kmh = 0.0

    # Frequency features
    txn_counts = {w: sum(1 for t in timestamps if curr_time - t <= w) + 1
                  for w in (3600, 86400, 604800)}

    return {
        'amt': txn.amount,
        'category': CATEGORY_INDEX.get(txn.category, 0),
        'channel': CHANNEL_INDEX.get(txn.channel, 0),
        'f_amount_zscore': f_amount_zscore,
        'f_amount_to_avg_ratio': f_amount_to_avg_ratio,
        'f_travel_velocity_kmh': f_travel_velocity_kmh,
        'f_travel_distance_km': f_travel_distance_km,
        'f_txn_count_1h': txn_counts[3600],
        'f_txn_count_24h': txn_counts[86400],
        'f_txn_count_7d': txn_counts[604800],
        'f_seconds_since_last_txn': f_seconds_since_last_txn,
        'f_hour_of_day': txn.local_hour_of_day,
        'f_is_new_device': int(txn.device_id not in []),
        'f_is_new_merchant': int(txn.merchant not in merchants)
    }
