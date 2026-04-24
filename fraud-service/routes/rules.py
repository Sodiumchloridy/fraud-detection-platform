from fastapi import APIRouter
from pydantic import BaseModel
from core.rules import (
    Rule, get_rules, set_rules,
    get_blocklist, set_blocklist,
    get_allowlist, set_allowlist,
    get_ai_enabled, set_ai_enabled,
)

router = APIRouter()


class CardList(BaseModel):
    cards: list[str]


class AiScoringConfig(BaseModel):
    enabled: bool


@router.get("/rules")
def list_rules():
    return [r.model_dump() for r in get_rules()]


@router.put("/rules")
def update_rules(rules: list[Rule]):
    set_rules(rules)
    return [r.model_dump() for r in get_rules()]


@router.get("/blocklist")
def list_blocklist():
    return get_blocklist()


@router.put("/blocklist")
def update_blocklist(data: CardList):
    set_blocklist(data.cards)
    return get_blocklist()


@router.get("/allowlist")
def list_allowlist():
    return get_allowlist()


@router.put("/allowlist")
def update_allowlist(data: CardList):
    set_allowlist(data.cards)
    return get_allowlist()


@router.get("/ai-scoring")
def get_ai_scoring():
    return {"enabled": get_ai_enabled()}


@router.put("/ai-scoring")
def update_ai_scoring(data: AiScoringConfig):
    set_ai_enabled(data.enabled)
    return {"enabled": get_ai_enabled()}
