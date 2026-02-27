import numpy as np
from models import Transaction, HistoricalTxn, parse_ts


VELOCITY_BLOCK_THRESHOLD_KMH = 1500.0
CATEGORIES = [
    'entertainment', 'food_dining', 'gas_transport', 'grocery_net',
    'grocery_pos', 'health_fitness', 'home', 'kids_pets',
    'misc_net', 'misc_pos', 'personal_care', 'shopping_net',
    'shopping_pos', 'travel'
]
CATEGORY_INDEX = {c: i for i, c in enumerate(CATEGORIES)}
CHANNELS = ['in_store', 'online', 'atm']
CHANNEL_INDEX = {c: i for i, c in enumerate(CHANNELS)}


# Helper methods

def haversine(lat1, lon1, lat2, lon2):
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * np.arcsin(np.sqrt(a)) * 6371

def _parse_history(history):
    if not history:
        return [], [], None, set()
    amounts    = [h.amount for h in history][-100:]
    timestamps = [parse_ts(h.timestamp).timestamp() for h in history]
    merchants  = {h.merchant for h in history if h.merchant}
    return amounts, timestamps, history[-1], merchants

def _amount_features(amount, amounts):
    if not amounts:
        return 0.0, 1.0
    mean = np.mean(amounts)
    std  = np.std(amounts) if len(amounts) > 1 else 1.0
    return (amount - mean) / (std or 1.0), amount / mean if mean else 1.0

def _velocity_features(txn, last, timestamps, curr_time):
    if not (last and timestamps):
        return 0.0, 0.0, 0.0
    dist = haversine(last.latitude, last.longitude, txn.latitude, txn.longitude)
    dt   = curr_time - timestamps[-1]
    vel  = dist * 3600 / dt if dt > 0.36 else 0.0
    return dist, dt, vel

def _txn_counts(timestamps, curr_time):
    return {w: sum(1 for t in timestamps if curr_time - t <= w) + 1
            for w in (3600, 86400, 604800)}


# Public APIs

def compute_features(txn: Transaction, curr_time: float, history: list[HistoricalTxn]) -> dict:
    amounts, timestamps, last, merchants = _parse_history(history)
    zscore, ratio  = _amount_features(txn.amount, amounts)
    dist, dt, vel  = _velocity_features(txn, last, timestamps, curr_time)
    counts         = _txn_counts(timestamps, curr_time)

    return {
        'amt':                      txn.amount,
        'category':                 CATEGORY_INDEX.get(txn.category, 0),
        'channel':                  CHANNEL_INDEX.get(txn.channel, 0),
        'f_amount_zscore':          zscore,
        'f_amount_to_avg_ratio':    ratio,
        'f_travel_velocity_kmh':    vel,
        'f_travel_distance_km':     dist,
        'f_txn_count_1h':           counts[3600],
        'f_txn_count_24h':          counts[86400],
        'f_txn_count_7d':           counts[604800],
        'f_seconds_since_last_txn': dt,
        'f_hour_of_day':            txn.local_hour_of_day,
        'f_is_new_device':          int(txn.device_id not in []),
        'f_is_new_merchant':        int(txn.merchant not in merchants),
    }


def get_lstm_features(history: list[HistoricalTxn], seq_len: int = 50):
    """Raw sequence for LSTM — feature list TBD."""
    # TODO: decide on final feature columns
    return [
        [h.amount, parse_ts(h.timestamp).hour]
        for h in history[-seq_len:]
    ]
