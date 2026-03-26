import numpy as np
import pandas as pd
from schemas import Transaction, HistoricalTransaction, parse_ts


RISKY_EMAIL_DOMAINS = {
    'yandex.ru', 'qq.com',
    'naver.com', 'anonymous', 'tempmail', 'anonymous.com', 'tempmail.com'
}

# ── Feature lists matching the trained LightGBM model ──
CORE_FEATURES = [
    'amt', 'card_id', 'card_network', 'card_type',
    'card_issuing_country', 'billing_zip_code', 'billing_country_code',
    'device_type', 'device_info',
    'purchaser_email_domain', 'recipient_email_domain',
]

DERIVED_FEATURES = [
    'hour_of_day', 'seconds_since_last_txn',
    'amount_to_avg_ratio', 'amount_zscore',
    'txn_count_1h', 'txn_count_24h', 'txn_count_7d',
    'billing_country_mismatch',
    'is_risky_email', 'email_domain_mismatch', 'is_new_email',
    'is_new_device', 'is_new_merchant',
]

TE_COLS = ['card_id', 'purchaser_email_domain']

# Features used by the LightGBM model (order must match training)
MODEL_FEATURE_ORDER = CORE_FEATURES + DERIVED_FEATURES + [c + '_TE' for c in TE_COLS]

# Categorical columns that need integer encoding (were string/category in training)
CAT_COLS = [
    'card_network', 'card_type', 'device_type', 'device_info',
    'purchaser_email_domain', 'recipient_email_domain',
]

# Default target-encoding value (≈ global fraud rate from IEEE-CIS training set)
DEFAULT_TE_VALUE = 0.035


# ── Helpers ──────────────────────────────────────────────────────────────

def haversine(lat1, lon1, lat2, lon2):
    """Great-circle distance in km.  Used by rules (impossible-travel)."""
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat, dlon = lat2 - lat1, lon2 - lon1
    a = np.sin(dlat / 2) ** 2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon / 2) ** 2
    return 2 * np.arcsin(np.sqrt(a)) * 6371


def _parse_history(history):
    if not history:
        return [], [], None, set(), set(), set()
    amounts    = [h.amount for h in history][-100:]
    timestamps = [parse_ts(h.timestamp).timestamp() for h in history]
    merchants  = {h.merchant for h in history if h.merchant}
    devices    = {h.device_id for h in history if h.device_id}
    emails     = {h.purchaser_email_domain for h in history if h.purchaser_email_domain}
    return amounts, timestamps, history[-1], merchants, devices, emails


def _amount_features(amount, amounts):
    if not amounts:
        return 0.0, 1.0
    mean = np.mean(amounts)
    std  = np.std(amounts) if len(amounts) > 1 else 1.0
    zscore = (amount - mean) / std if std > 0 else 0.0
    if len(amounts) < 30:
        zscore = 0.0
    return zscore, amount / mean if mean else 1.0


def _velocity_features(txn, last, timestamps, curr_time):
    """Travel velocity — used only by rules, not by the model."""
    if not (last and timestamps):
        return 0.0, 99999999.0, 0.0
    lat1 = getattr(last, 'latitude', None) or 0.0
    lon1 = getattr(last, 'longitude', None) or 0.0
    lat2 = txn.latitude or 0.0
    lon2 = txn.longitude or 0.0
    if not (lat1 and lon1 and lat2 and lon2):
        return 0.0, 99999999.0, 0.0
    dist = haversine(lat1, lon1, lat2, lon2)
    dt   = curr_time - timestamps[-1]
    vel  = dist * 3600 / dt if dt > 0.36 else 0.0
    return dist, dt, vel


def _txn_counts(timestamps, curr_time):
    return {w: sum(1 for t in timestamps if curr_time - t <= w) + 1
            for w in (3600, 86400, 604800)}


def _encode_categorical(value: str | None) -> int:
    """Hash-based integer encoding for categorical string features."""
    if not value or value == 'nan':
        return 0
    return (hash(value) % 2**31) + 1


# ── Public API ───────────────────────────────────────────────────────────

def compute_features(txn: Transaction, curr_time: float, history: list[HistoricalTransaction]) -> dict:
    """Compute all features for both model prediction and rule evaluation."""
    amounts, timestamps, last, merchants, devices, emails = _parse_history(history)
    zscore, ratio  = _amount_features(txn.amount, amounts)
    dist, dt, vel  = _velocity_features(txn, last, timestamps, curr_time)
    counts         = _txn_counts(timestamps, curr_time)

    p_email = txn.purchaser_email_domain or ''
    r_email = txn.recipient_email_domain or ''

    return {
        # ── Core fields ──
        'amt':                      txn.amount,
        'card_id':                  txn.card_number,
        'card_network':             txn.card_network or '',
        'card_type':                txn.card_type or '',
        'card_issuing_country':     txn.card_issuing_country,
        'billing_zip_code':         txn.billing_zip_code,
        'billing_country_code':     txn.billing_country_code,
        'device_type':              txn.device_type or '',
        'device_info':              txn.device_info or '',
        'purchaser_email_domain':   p_email,
        'recipient_email_domain':   r_email,

        # ── Derived features ──
        'hour_of_day':              txn.local_hour_of_day,
        'seconds_since_last_txn':   dt,
        'amount_to_avg_ratio':      ratio,
        'amount_zscore':            zscore,
        'txn_count_1h':             counts[3600],
        'txn_count_24h':            counts[86400],
        'txn_count_7d':             counts[604800],
        'billing_country_mismatch': float(txn.card_issuing_country != txn.billing_country_code)
                                    if txn.card_issuing_country and txn.billing_country_code else 0.0,
        'is_risky_email':           float(p_email in RISKY_EMAIL_DOMAINS),
        'email_domain_mismatch':    float(p_email != r_email) if (p_email and r_email) else 0.0,
        'is_new_email':             float(p_email not in emails) if p_email else 0.0,
        'is_new_device':            float(txn.device_id not in devices) if txn.device_id else 0.0,
        'is_new_merchant':          float(txn.merchant not in merchants) if txn.merchant else 0.0,

        # ── Target-encoding proxies (no label data at inference) ──
        'card_id_TE':               DEFAULT_TE_VALUE,
        'purchaser_email_domain_TE': DEFAULT_TE_VALUE,

        # ── Rule-only features (not used by the model) ──
        'travel_velocity_kmh':      vel,
        'travel_distance_km':       dist,
    }


def prepare_model_input(features: dict) -> pd.DataFrame:
    """Build a single-row DataFrame matching training-time encoding."""
    ZERO_FEATURES = {'card_id'}
    row = {}
    for f in MODEL_FEATURE_ORDER:
        if f in ZERO_FEATURES:
            row[f] = np.int32(0)
        elif f in CAT_COLS:
            row[f] = np.int32(_encode_categorical(features.get(f)))
        elif isinstance(features.get(f), str):
            row[f] = np.int32(_encode_categorical(features.get(f)))
        else:
            row[f] = np.float32(features.get(f) if features.get(f) is not None else 0.0)
    return pd.DataFrame([row])

