import pandas as pd
import numpy as np
import shap
from autogluon.tabular import TabularPredictor

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
    model: TabularPredictor,
    input_df: pd.DataFrame,
    feature_order: list[str] = None,
) -> dict:
    """Compute local feature attributions using SHAP KernelExplainer."""
    cols = input_df.columns.tolist() if feature_order is None else feature_order

    # KernelExplainer requires a fully numeric array.
    # Encode categorical (string) columns to integer codes and store the reverse mapping
    # so predict_fn can decode them back before calling AutoGluon.
    cat_encoders: dict[str, np.ndarray] = {}
    encoded_df = input_df[cols].copy()
    for col in encoded_df.select_dtypes(include=["object", "category"]).columns:
        codes, uniques = pd.factorize(encoded_df[col])
        cat_encoders[col] = uniques
        encoded_df[col] = codes.astype(float)

    # All-zero numeric background (one row)
    background = pd.DataFrame(np.zeros((1, len(cols))), columns=cols)

    def predict_fn(x):
        df = pd.DataFrame(x, columns=cols)
        # Decode integer codes back to the original category strings
        for col, uniques in cat_encoders.items():
            idx = df[col].round().astype(int).clip(0, len(uniques) - 1)
            df[col] = uniques[idx]
        # Using class 1 probabilities
        return model.predict_proba(df).iloc[:, 1].values

    explainer = shap.KernelExplainer(predict_fn, background)
    # Compute SHAP values for the single (encoded) input row
    shap_values_raw = explainer.shap_values(encoded_df, silent=True)
    
    if isinstance(shap_values_raw, list):
        sv = shap_values_raw[1][0] if len(shap_values_raw) > 1 else shap_values_raw[0][0]
    elif hasattr(shap_values_raw, 'shape') and len(shap_values_raw.shape) == 3:
        sv = shap_values_raw[0, :, 1]
    elif hasattr(shap_values_raw, 'shape') and len(shap_values_raw.shape) == 2:
        sv = shap_values_raw[0, :]
    else:
        sv = shap_values_raw[0]

    # Handle the expected value
    if isinstance(explainer.expected_value, (list, np.ndarray)) and len(explainer.expected_value) > 1:
        base_value = float(explainer.expected_value[1])
    else:
        base_value = float(explainer.expected_value)

    contributions = {feat: round(float(val), 6) for feat, val in zip(cols, sv)}

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
