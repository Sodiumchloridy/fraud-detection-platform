"""
Load inference artifacts (category lookups + threshold) from JSON.
"""

import json

import numpy as np

from .features import CAT_COLS, MODEL_FEATURE_ORDER


def load_artifacts(json_path: str) -> tuple[dict[str, dict[str, float]], float]:
    """Return (cat_lookups, threshold) from the cached JSON artifacts."""
    with open(json_path, "r") as f:
        data = json.load(f)
    return data["cat_lookups"], float(data["threshold"])


def encode_row(
    features: dict,
    feature_order: list[str],
    cat_lookups: dict[str, dict[str, float]],
) -> np.ndarray:
    """Encode a feature dict into a (1, n_features) float64 array — no pandas."""
    row = np.empty(len(feature_order), dtype=np.float64)
    for idx, feat in enumerate(feature_order):
        val = features.get(feat)
        lookup = cat_lookups.get(feat)
        if lookup is not None:
            key = str(val) if val is not None and val != "" else "nan"
            row[idx] = lookup.get(key, -1.0)
        else:
            row[idx] = float(val) if val is not None else np.nan
    return row.reshape(1, -1)
