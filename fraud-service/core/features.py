import numpy as np
from schemas import Transaction, HistoricalTransaction, parse_ts


RISKY_EMAIL_DOMAINS = {
    'yandex.ru', 'qq.com',
    'naver.com', 'anonymous', 'tempmail', 'anonymous.com', 'tempmail.com'
}

# ── Feature lists matching the trained LightGBM student model ──
CORE_FEATURES = [
    'amt', 'card_id', 'card_network', 'card_type',
    'card_issuing_country', 'billing_zip_code', 'billing_country_code',
    'device_type', 'device_info',
    'purchaser_email_domain', 'recipient_email_domain',
]

CAT_COLS = [
    'card_id', 'card_issuing_country', 'card_network', 'card_type',
    'billing_zip_code', 'billing_country_code', 'device_type',
    'device_info', 'purchaser_email_domain', 'recipient_email_domain',
]

DERIVED_FEATURES = [
    'hour_of_day', 'seconds_since_last_txn',
    'amount_to_avg_ratio', 'amount_zscore',
    'txn_count_1h', 'txn_count_24h', 'txn_count_7d',
    'billing_country_mismatch',
    'is_risky_email', 'email_domain_mismatch', 'is_new_email',
    'is_new_device', 'is_new_merchant',
    'amt_cents', 'day_of_week', 
    'amt_sum_1h', 'amt_sum_24h', 'amt_sum_7d'
]

# Features used by the LightGBM student model
MODEL_FEATURE_ORDER = CORE_FEATURES + DERIVED_FEATURES

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
    billing_zips = {getattr(h, 'billing_zip_code', None) for h in history if getattr(h, 'billing_zip_code', None)}
    device_infos = {getattr(h, "device_info", getattr(h, "device_id", None)) for h in history if getattr(h, "device_info", getattr(h, "device_id", None))}
    emails     = {getattr(h, 'purchaser_email_domain', None) for h in history if getattr(h, 'purchaser_email_domain', None)}
    return amounts, timestamps, history[-1], billing_zips, device_infos, emails


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
    dt = curr_time - timestamps[-1]
    lat1 = getattr(last, 'latitude', None)
    lon1 = getattr(last, 'longitude', None)
    lat2 = txn.latitude
    lon2 = txn.longitude
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return 0.0, dt, 0.0
    dist = haversine(lat1, lon1, lat2, lon2)
    vel  = dist * 3600 / dt if dt > 0.36 else 0.0
    return dist, dt, vel


def _txn_stats(timestamps, amounts, curr_time):
    stats = {}
    for w in (3600, 86400, 604800):
        in_window = [a for t, a in zip(timestamps, amounts) if curr_time - t <= w]
        stats[f'count_{w}'] = len(in_window) + 1 # +1 for current txn
        stats[f'sum_{w}'] = sum(in_window) # current txn amt not included closely matching logic
    return stats

# ── Public API ───────────────────────────────────────────────────────────

def compute_features(txn: Transaction, curr_time: float, history: list[HistoricalTransaction], precalc: dict = None) -> dict:
    """Compute all features for both model prediction and rule evaluation."""
    precalc = precalc or {}
    amounts, timestamps, last, billing_zips, device_infos, emails = _parse_history(history)
    zscore, ratio  = _amount_features(txn.amount, amounts)
    dist, dt, vel  = _velocity_features(txn, last, timestamps, curr_time)
    stats         = _txn_stats(timestamps, amounts, curr_time)

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
        'txn_count_1h':             precalc.get('txn_count_1h') if 'txn_count_1h' in precalc else stats['count_3600'],
        'txn_count_24h':            precalc.get('txn_count_24h') if 'txn_count_24h' in precalc else stats['count_86400'],
        'txn_count_7d':             precalc.get('txn_count_7d') if 'txn_count_7d' in precalc else stats['count_604800'],
        'billing_country_mismatch': float(txn.card_issuing_country != txn.billing_country_code)
                                    if txn.card_issuing_country and txn.billing_country_code else 0.0,
        'is_risky_email':           float(p_email in RISKY_EMAIL_DOMAINS),
        'email_domain_mismatch':    float(p_email != r_email) if (p_email and r_email) else 0.0,
        'is_new_email':             precalc.get('is_new_email') if 'is_new_email' in precalc else (float(p_email not in emails) if p_email else None),
        'is_new_device':            float(txn.device_info not in device_infos) if txn.device_info else None,
        'is_new_merchant':          float(txn.billing_zip_code not in billing_zips) if txn.billing_zip_code else None,
        
        # New features
        'amt_cents':                float(txn.amount % 1),
        'day_of_week':              float((curr_time // 86400) % 7),
        'amt_sum_1h':               precalc.get('amt_sum_1h') if 'amt_sum_1h' in precalc else stats['sum_3600'],
        'amt_sum_24h':              precalc.get('amt_sum_24h') if 'amt_sum_24h' in precalc else stats['sum_86400'],
        'amt_sum_7d':               precalc.get('amt_sum_7d') if 'amt_sum_7d' in precalc else stats['sum_604800'],

        # ── Rule-only features (not used by the model) ──
        'travel_velocity_kmh':      vel,
        'travel_distance_km':       dist,
    }


