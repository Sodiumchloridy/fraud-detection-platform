import pandas as pd
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
    input_df: pd.DataFrame,
    feature_order: list[str],
) -> dict:
    """Compute SHAP values using LightGBM's native pred_contrib (C++, much faster than SHAP lib)."""
    # pred_contrib returns [feature_contribs..., base_value] per row
    contribs = np.asarray(model.predict(input_df, pred_contrib=True)).flatten()
    # Last element is the base value (bias)
    base_value = float(contribs[-1])
    sv = contribs[:-1]

    contributions = {}
    for feat, val in zip(feature_order, sv):
        contributions[feat] = round(float(val), 6)

    sorted_features = sorted(
        contributions.items(), key=lambda x: abs(x[1]), reverse=True
    )

    top_features = [
        {
            "feature": feat,
            "label": FEATURE_LABELS.get(feat, feat),
            "shap_value": val,
            "feature_value": _safe_value(input_df[feat].iloc[0]),
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
