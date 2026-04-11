import numpy as np
import lightgbm as lgb

# Human-readable feature labels
FEATURE_LABELS = {
    'amt': 'Transaction Amount',
    'card_id': 'Card Identifier',
    'card_network': 'Card Network',
    'card_type': 'Card Type',
    'card_issuing_country': 'Card Issuing Country',
    'billing_zip_code': 'Billing ZIP Code',
    'billing_country_code': 'Billing Country Code',
    'device_type': 'Device Type',
    'device_info': 'Device Info',
    'purchaser_email_domain': 'Purchaser Email Domain',
    'recipient_email_domain': 'Recipient Email Domain',
    'hour_of_day': 'Hour of Day',
    'seconds_since_last_txn': 'Seconds Since Last Transaction',
    'amount_to_avg_ratio': 'Amount vs Average Ratio',
    'amount_zscore': 'Amount Z-Score',
    'txn_count_1h': 'Transactions in Last Hour',
    'txn_count_24h': 'Transactions in Last 24h',
    'txn_count_7d': 'Transactions in Last 7 Days',    
    'amt_cents': 'Amount Cents',
    'day_of_week': 'Day of Week',
    'amt_sum_1h': 'Transaction Amount Sum in 1 Hour',
    'amt_sum_24h': 'Transaction Amount Sum in 24 Hours',
    'amt_sum_7d': 'Transaction Amount Sum in 7 Days',    
    'billing_country_mismatch': 'Billing Country Mismatch',
    'is_risky_email': 'Risky Email Domain',
    'email_domain_mismatch': 'Email Domain Mismatch',
    'is_new_email': 'New Email',
    'is_new_device': 'New Device',
    'is_new_merchant': 'New Merchant',
    'card_id_TE': 'Card Fraud History',
    'purchaser_email_domain_TE': 'Email Fraud History',
}


def compute_shap_values(
    model: lgb.Booster,
    encoded: np.ndarray,
    feature_names: list[str],
    raw_features: dict,
) -> dict:
    """Compute local feature attributions using LightGBM's native pred_contrib.

    Uses the exact tree-path SHAP algorithm built into LightGBM, which is
    both faster and more accurate than model-agnostic approaches like
    KernelExplainer.
    """
    # pred_contrib returns shape (n_samples, n_features + 1)
    # The last column is the bias (base value); the rest are per-feature SHAP values.
    contrib = model.predict(encoded, pred_contrib=True)

    base_value = float(contrib[0, -1])
    shap_vals = contrib[0, :-1]

    contributions = {feat: round(float(val), 6) for feat, val in zip(feature_names, shap_vals)}

    sorted_features = sorted(
        contributions.items(), key=lambda x: abs(x[1]), reverse=True
    )

    top_features = [
        {
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "shap_value": val,
            "feature_value": _safe_value(raw_features.get(feat)),
        }
        for feat, val in sorted_features
    ]

    return {
        "base_value": round(base_value, 6),
        "shap_values": contributions,
        "top_features": top_features,
    }


def _safe_value(v):
    """Convert numpy types to JSON-serializable Python types."""
    if hasattr(v, 'item'):
        return v.item()
    return v
