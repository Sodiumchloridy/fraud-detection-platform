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
    override: bool = False # If true, sets score to penalty value instead of adding
    enabled: bool = True


DEFAULT_RULES = [
    {
        "id": "velocity_block",
        "name": "Impossible Travel",
        "description": "Block if travel velocity indicates impossible movement between transactions",
        "feature": "f_travel_velocity_kmh",
        "operator": ">",
        "threshold": 1500.0,
        "penalty": 1.0,
        "override": True,
        "enabled": True,
    },
    {
        "id": "high_zscore",
        "name": "Unusual Amount",
        "description": "Flag if transaction amount deviates significantly from cardholder average",
        "feature": "f_amount_zscore",
        "operator": ">",
        "threshold": 3.0,
        "penalty": 0.15,
        "override": False,
        "enabled": True,
    },
    {
        "id": "rapid_burst",
        "name": "Rapid Transaction Burst",
        "description": "Flag if too many transactions occur within one hour",
        "feature": "f_txn_count_1h",
        "operator": ">",
        "threshold": 5,
        "penalty": 0.10,
        "override": False,
        "enabled": True,
    },
    {
        "id": "large_ratio",
        "name": "Large Amount Ratio",
        "description": "Flag if transaction amount is much larger than cardholder average",
        "feature": "f_amount_to_avg_ratio",
        "operator": ">",
        "threshold": 5.0,
        "penalty": 0.10,
        "override": False,
        "enabled": True,
    },
    {
        "id": "new_device",
        "name": "New Device",
        "description": "Add risk when transaction comes from a device not seen before",
        "feature": "f_is_new_device",
        "operator": "==",
        "threshold": 1,
        "penalty": 0.05,
        "override": False,
        "enabled": True,
    },
    {
        "id": "new_merchant",
        "name": "New Merchant",
        "description": "Add risk when transaction is at a merchant not visited before",
        "feature": "f_is_new_merchant",
        "operator": "==",
        "threshold": 1,
        "penalty": 0.03,
        "override": False,
        "enabled": False,
    },
]

_rules: list[Rule] = [Rule(**r) for r in DEFAULT_RULES]


def get_rules() -> list[Rule]:
    return _rules


def set_rules(rules: list[Rule]):
    global _rules
    _rules = rules


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
            if rule.override:
                score = max(score, rule.penalty)
            else:
                score += rule.penalty

    return min(score, 1.0), triggered
