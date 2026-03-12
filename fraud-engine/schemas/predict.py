from .base import BaseSchema
from .transaction import Transaction, HistoricalTransaction


class PredictRequest(BaseSchema):
    transaction: Transaction
    history: list[HistoricalTransaction] = []
