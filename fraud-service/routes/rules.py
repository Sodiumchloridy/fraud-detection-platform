from fastapi import APIRouter
from pydantic import BaseModel
from core.rules import (
    Rule, get_rules, set_rules,
    get_blocklist, set_blocklist,
    get_allowlist, set_allowlist,
)

router = APIRouter()


class CardList(BaseModel):
    cards: list[str]


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
