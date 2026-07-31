import logging
import os
from typing import Optional

import redis

logger = logging.getLogger(__name__)

CARD_HISTORY_AMOUNTS = "feature:card:amounts:"
EMAIL_HISTORY = "feature:email:txn_times:"

_SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

_redis: Optional[redis.Redis] = None


def init_redis():
    """Connect to Redis. Call once at startup."""
    global _redis
    host = os.getenv("REDIS_HOST", "localhost")
    port = int(os.getenv("REDIS_PORT", "6379"))
    _redis = redis.Redis(
        host=host, port=port, decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
    try:
        _redis.ping()
        logger.info("Connected to Redis at %s:%s", host, port)
    except (redis.ConnectionError, redis.TimeoutError, OSError) as exc:
        logger.warning("Redis at %s:%s is not reachable — will use fallback features: %s", host, port, exc)
        _redis = None


def push_transaction(card_number: str, amount: float, timestamp_ms: int,
                     email_domain: str | None = None):
    """Update the Redis feature store with a new transaction."""
    if _redis is None:
        return
    try:
        card_key = CARD_HISTORY_AMOUNTS + card_number
        entry = f"{timestamp_ms}:{amount}"
        _redis.zadd(card_key, {entry: timestamp_ms})

        cutoff = timestamp_ms - _SEVEN_DAYS_MS
        _redis.zremrangebyscore(card_key, 0, cutoff)

        if email_domain:
            email_key = EMAIL_HISTORY + email_domain
            _redis.zadd(email_key, {str(timestamp_ms): timestamp_ms})
            _redis.zremrangebyscore(email_key, 0, cutoff)
    except Exception as e:
        logger.warning("Redis unavailable, skipping feature push: %s", e)


def calculate_features(card_number: str, email_domain: str | None,
                       current_ms: int) -> dict:
    """Retrieve rolling-window features from Redis."""
    if _redis is None:
        return {}
    try:
        one_hour_ago = current_ms - 3_600_000
        one_day_ago = current_ms - 86_400_000
        seven_days_ago = current_ms - _SEVEN_DAYS_MS

        card_key = CARD_HISTORY_AMOUNTS + card_number

        count_1h = _redis.zcount(card_key, one_hour_ago, current_ms) or 0
        count_24h = _redis.zcount(card_key, one_day_ago, current_ms) or 0
        count_7d = _redis.zcount(card_key, seven_days_ago, current_ms) or 0

        entries_1h = _redis.zrangebyscore(card_key, one_hour_ago, current_ms)
        entries_24h = _redis.zrangebyscore(card_key, one_day_ago, current_ms)
        entries_7d = _redis.zrangebyscore(card_key, seven_days_ago, current_ms)

        features: dict = {
            "txn_count_1h": count_1h,
            "txn_count_24h": count_24h,
            "txn_count_7d": count_7d,
            "amt_sum_1h": _sum_amounts(entries_1h),
            "amt_sum_24h": _sum_amounts(entries_24h),
            "amt_sum_7d": _sum_amounts(entries_7d),
        }

        if email_domain:
            email_key = EMAIL_HISTORY + email_domain
            email_txns = _redis.zcount(email_key, 0, current_ms) or 0
            features["is_new_email"] = 1.0 if email_txns == 0 else 0.0
        else:
            features["is_new_email"] = 0.0

        return features
    except Exception as e:
        logger.warning("Redis unavailable, returning empty features: %s", e)
        return {}


def _sum_amounts(entries: list[str]) -> float:
    total = 0.0
    for entry in entries:
        parts = entry.split(":")
        if len(parts) == 2:
            total += float(parts[1])
    return total

def get_redis() -> Optional[redis.Redis]:
    """Return the active Redis client."""
    return _redis
