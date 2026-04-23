"""Encode features for LightGBM inference using category mappings stored in the model file."""

import numpy as np
import lightgbm as lgb

from .features import CAT_COLS, MODEL_FEATURE_ORDER


def extract_cat_lookups(model: lgb.Booster) -> dict[str, dict[str, int]]:
    """Build {col: {value: code}} from the model's pandas_categorical metadata."""
    cats = model.pandas_categorical
    if not cats:
        raise RuntimeError("Model has no pandas_categorical — was it trained with category dtypes?")
    return {
        col: {str(val): idx for idx, val in enumerate(values)}
        for col, values in zip(CAT_COLS, cats)
    }


def encode_row(
    features: dict,
    feature_order: list[str],
    cat_lookups: dict[str, dict[str, int]],
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
