from fastapi import APIRouter
from core.rules import Rule, get_rules, set_rules

router = APIRouter()


@router.get("/rules")
def list_rules():
    return [r.model_dump() for r in get_rules()]


@router.put("/rules")
def update_rules(rules: list[Rule]):
    set_rules(rules)
    return [r.model_dump() for r in get_rules()]
