import numpy as np
from schemas import Transaction, HistoricalTransaction, parse_ts


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
        return [], [], None, set(), set()
    amounts    = [h.amount for h in history][-100:]
    timestamps = [parse_ts(h.timestamp).timestamp() for h in history]
    merchants  = {h.merchant for h in history if h.merchant}
    devices    = {h.device_id for h in history if h.device_id}
    return amounts, timestamps, history[-1], merchants, devices

def _amount_features(amount, amounts):
    if not amounts:
        return 0.0, 1.0
    mean = np.mean(amounts)
    std  = np.std(amounts) if len(amounts) > 1 else 1.0
    zscore = (amount - mean) / std if std > 0 else 0.0
    if len(amounts) < 30:
        zscore = 0.0  # Avoid overfitting to small samples
    return zscore, amount / mean if mean else 1.0

def _velocity_features(txn, last, timestamps, curr_time):
    if not (last and timestamps):
        return 0.0, 99999999.0, 0.0
    dist = haversine(last.latitude, last.longitude, txn.latitude, txn.longitude)
    dt   = curr_time - timestamps[-1]
    vel  = dist * 3600 / dt if dt > 0.36 else 0.0
    return dist, dt, vel

def _txn_counts(timestamps, curr_time):
    return {w: sum(1 for t in timestamps if curr_time - t <= w) + 1
            for w in (3600, 86400, 604800)}


# Public APIs

def compute_features(txn: Transaction, curr_time: float, history: list[HistoricalTransaction]) -> dict:
    amounts, timestamps, last, merchants, devices = _parse_history(history)
    zscore, ratio  = _amount_features(txn.amount, amounts)
    dist, dt, vel  = _velocity_features(txn, last, timestamps, curr_time)
    counts         = _txn_counts(timestamps, curr_time)

    return {
        'amt':                      txn.amount,
        'category':                 CATEGORY_INDEX.get(txn.category, 0),
        'channel':                  CHANNEL_INDEX.get(txn.channel, 0),
        'amount_zscore':            zscore,
        'amount_to_avg_ratio':      ratio,
        'travel_velocity_kmh':      vel,
        'travel_distance_km':       dist,
        'txn_count_1h':             counts[3600],
        'txn_count_24h':            counts[86400],
        'txn_count_7d':             counts[604800],
        'seconds_since_last_txn':   dt,
        'hour_of_day':              txn.local_hour_of_day,
        'is_new_device':            int(txn.device_id not in devices),
        'is_new_merchant':          int(txn.merchant not in merchants),
        'billing_country':          txn.billingCountry or '',
        'email_domain':             txn.emailDomain or '',
        'device_type':              txn.deviceType or '',
    }

