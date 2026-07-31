import operator as op
import json
import threading
import logging
from pydantic import BaseModel
from .feature_store import get_redis

logger = logging.getLogger(__name__)

OPS = {'>': op.gt, '>=': op.ge, '<': op.lt, '<=': op.le, '==': op.eq}

class Rule(BaseModel):
    id: str
    name: str
    description: str
    feature: str
    operator: str          # >, <, >=, <=, ==
    threshold: float
    penalty: float         # Score contribution (0.0–1.0)
    enabled: bool = True


DEFAULT_RULES = [
    {
        "id": "velocity_block",
        "name": "Impossible Travel",
        "description": "Block if travel velocity indicates impossible movement between transactions",
        "feature": "travel_velocity_kmh",
        "operator": ">",
        "threshold": 1500.0,
        "penalty": 0.40,
        "enabled": True,
    },
    {
        "id": "high_zscore",
        "name": "Unusual Amount",
        "description": "Flag if transaction amount deviates significantly from cardholder average",
        "feature": "amount_zscore",
        "operator": ">",
        "threshold": 3.0,
        "penalty": 0.15,
        "enabled": False,
    },
    {
        "id": "rapid_burst",
        "name": "Rapid Transaction Burst",
        "description": "Flag if too many transactions occur within one hour",
        "feature": "txn_count_1h",
        "operator": ">",
        "threshold": 5,
        "penalty": 0.10,
        "enabled": False,
    },
    {
        "id": "txn_amount",
        "name": "Transaction Amount",
        "description": "Flag if transaction amount is much larger",
        "feature": "amount_to_avg_ratio",
        "operator": ">",
        "threshold": 50000.0,
        "penalty": 0.40,
        "enabled": True,
    },
    {
        "id": "new_device",
        "name": "New Device",
        "description": "Add risk when transaction comes from a device not seen before",
        "feature": "is_new_device",
        "operator": "==",
        "threshold": 1,
        "penalty": 0.05,
        "enabled": False,
    },
    {
        "id": "new_merchant",
        "name": "New Merchant",
        "description": "Add risk when transaction is at a merchant not visited before",
        "feature": "is_new_merchant",
        "operator": "==",
        "threshold": 1,
        "penalty": 0.03,
        "enabled": False,
    },
    {
        "id": "seconds_since_last_txn",
        "name": "Seconds Since Last Transaction",
        "description": "Flag if the time since the last transaction is very short, indicating a possible card test or burst attack",
        "feature": "seconds_since_last_txn",
        "operator": "<=",
        "threshold": 1,
        "penalty": 0.3,
        "enabled": True,
    }
]

_rules_cache: list[Rule] | None = None
_blocklist_cache: list[str] | None = None
_allowlist_cache: list[str] | None = None
_ai_enabled_cache: bool | None = None
_lock = threading.Lock()


def get_rules() -> list[Rule]:
    global _rules_cache
    with _lock:
        if _rules_cache is not None:
            return _rules_cache

    r = get_redis()
    if r:
        try:
            data = r.get("config:rules")
            if data:
                rules = [Rule(**x) for x in json.loads(data)]
                with _lock:
                    _rules_cache = rules
                return rules
        except Exception as e:
            logger.warning(f"Failed to read rules from Redis: {e}")

    with _lock:
        if _rules_cache is None:
            _rules_cache = [Rule(**r) for r in DEFAULT_RULES]
        return _rules_cache


def set_rules(rules: list[Rule]):
    global _rules_cache
    r = get_redis()
    if r:
        try:
            r.set("config:rules", json.dumps([rule.dict() for rule in rules]))
        except Exception as e:
            logger.warning(f"Failed to write rules to Redis: {e}")
    with _lock:
        _rules_cache = rules


def get_blocklist() -> list[str]:
    global _blocklist_cache
    with _lock:
        if _blocklist_cache is not None:
            return list(_blocklist_cache)

    r = get_redis()
    if r:
        try:
            data = r.get("config:blocklist")
            if data:
                bl = json.loads(data)
                with _lock:
                    _blocklist_cache = bl
                return list(bl)
        except Exception as e:
            logger.warning(f"Failed to read blocklist from Redis: {e}")

    with _lock:
        if _blocklist_cache is None:
            _blocklist_cache = []
        return list(_blocklist_cache)


def set_blocklist(cards: list[str]) -> None:
    global _blocklist_cache
    r = get_redis()
    if r:
        try:
            r.set("config:blocklist", json.dumps(cards))
        except Exception as e:
            logger.warning(f"Failed to write blocklist to Redis: {e}")
    with _lock:
        _blocklist_cache = list(cards)


def get_allowlist() -> list[str]:
    global _allowlist_cache
    with _lock:
        if _allowlist_cache is not None:
            return list(_allowlist_cache)

    r = get_redis()
    if r:
        try:
            data = r.get("config:allowlist")
            if data:
                al = json.loads(data)
                with _lock:
                    _allowlist_cache = al
                return list(al)
        except Exception as e:
            logger.warning(f"Failed to read allowlist from Redis: {e}")

    with _lock:
        if _allowlist_cache is None:
            _allowlist_cache = []
        return list(_allowlist_cache)


def set_allowlist(cards: list[str]) -> None:
    global _allowlist_cache
    r = get_redis()
    if r:
        try:
            r.set("config:allowlist", json.dumps(cards))
        except Exception as e:
            logger.warning(f"Failed to write allowlist to Redis: {e}")
    with _lock:
        _allowlist_cache = list(cards)


def is_blocked(card_number: str) -> bool:
    return card_number in get_blocklist()


def is_allowlisted(card_number: str) -> bool:
    return card_number in get_allowlist()


def get_ai_enabled() -> bool:
    global _ai_enabled_cache
    with _lock:
        if _ai_enabled_cache is not None:
            return _ai_enabled_cache

    r = get_redis()
    if r:
        try:
            data = r.get("config:ai_enabled")
            if data:
                enabled = json.loads(data)
                with _lock:
                    _ai_enabled_cache = enabled
                return enabled
        except Exception as e:
            logger.warning(f"Failed to read ai_enabled from Redis: {e}")

    with _lock:
        if _ai_enabled_cache is None:
            _ai_enabled_cache = True
        return _ai_enabled_cache


def set_ai_enabled(enabled: bool) -> None:
    global _ai_enabled_cache
    r = get_redis()
    if r:
        try:
            r.set("config:ai_enabled", json.dumps(enabled))
        except Exception as e:
            logger.warning(f"Failed to write ai_enabled to Redis: {e}")
    with _lock:
        _ai_enabled_cache = enabled


def apply_rules(features: dict, base_score: float) -> tuple[float, list[str]]:
    """Apply enabled rules to computed features.
    Returns (capped_score, list_of_triggered_rule_ids).
    """
    triggered: list[str] = []
    score = base_score

    for rule in get_rules():
        if not rule.enabled:
            continue
        value = features.get(rule.feature)
        if value is None:
            continue

        cmp = OPS.get(rule.operator)
        if cmp and cmp(value, rule.threshold):
            triggered.append(rule.id)
            score += rule.penalty

    return min(score, 1.0), triggered
