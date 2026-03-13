import shap
import pandas as pd
import numpy as np
from xgboost import XGBClassifier

# Human-readable feature labels
FEATURE_LABELS = {
    'amt': 'Transaction Amount',
    'category': 'Category',
    'channel': 'Channel',
    'f_amount_zscore': 'Amount Z-Score',
    'f_amount_to_avg_ratio': 'Amount vs Average Ratio',
    'f_travel_velocity_kmh': 'Travel Velocity (km/h)',
    'f_travel_distance_km': 'Travel Distance (km)',
    'f_txn_count_1h': 'Transactions in Last Hour',
    'f_txn_count_24h': 'Transactions in Last 24h',
    'f_txn_count_7d': 'Transactions in Last 7 Days',
    'f_seconds_since_last_txn': 'Seconds Since Last Transaction',
    'f_hour_of_day': 'Hour of Day',
    'f_is_new_device': 'New Device',
    'f_is_new_merchant': 'New Merchant',
}


def compute_shap_values(
    model: XGBClassifier,
    input_df: pd.DataFrame,
    feature_order: list[str],
) -> dict:
    """Compute SHAP values for a single prediction and return a structured explanation.

    Uses model_output='raw' (log-odds space) which is required for the default
    tree_path_dependent feature perturbation algorithm.
    """
    explainer = shap.TreeExplainer(model, model_output="raw")
    shap_values = explainer.shap_values(input_df)

    # shap_values may be a single array for binary classification
    sv = np.asarray(shap_values).flatten()
    base_value = float(explainer.expected_value)

    contributions = {}
    for feat, val in zip(feature_order, sv):
        contributions[feat] = round(float(val), 6)

    # Sort by absolute impact (descending)
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
