import operator as op
from pydantic import BaseModel

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

_rules: list[Rule] = [Rule(**r) for r in DEFAULT_RULES]
_blocklist: list[str] = []
_allowlist: list[str] = []
_ai_enabled: bool = True


def get_rules() -> list[Rule]:
    return _rules


def set_rules(rules: list[Rule]):
    global _rules
    _rules = rules


def get_blocklist() -> list[str]:
    return list(_blocklist)


def set_blocklist(cards: list[str]) -> None:
    global _blocklist
    _blocklist = list(cards)


def get_allowlist() -> list[str]:
    return list(_allowlist)


def set_allowlist(cards: list[str]) -> None:
    global _allowlist
    _allowlist = list(cards)


def is_blocked(card_number: str) -> bool:
    return card_number in _blocklist


def is_allowlisted(card_number: str) -> bool:
    return card_number in _allowlist


def get_ai_enabled() -> bool:
    return _ai_enabled


def set_ai_enabled(enabled: bool) -> None:
    global _ai_enabled
    _ai_enabled = enabled


def apply_rules(features: dict, base_score: float) -> tuple[float, list[str]]:
    """Apply enabled rules to computed features.
    Returns (capped_score, list_of_triggered_rule_ids).
    """
    triggered: list[str] = []
    score = base_score

    for rule in _rules:
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
