from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import time


def parse_ts(ts: str) -> datetime:
    """Parse an ISO timestamp, treating 'Z' as UTC."""
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))


class Transaction(BaseModel):
    cc_number: str
    amount: float
    category: str
    channel: str = 'in_store'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''
    timestamp: Optional[str] = None

    @property
    def local_hour_of_day(self) -> int:
        """Calculate hour in user's timezone based on longitude (rough estimate)"""
        if self.timestamp and self.longitude is not None:
            utc_dt = parse_ts(self.timestamp)
            return (utc_dt.hour + round(self.longitude / 15)) % 24
        return int((time.time() % 86400) // 3600)


class HistoricalTxn(BaseModel):
    model_config = ConfigDict(extra='allow')

    amount: float
    timestamp: str
    latitude: float = 0.0
    longitude: float = 0.0
    merchant: str = ''
    device_id: str = ''


class PredictRequest(BaseModel):
    transaction: Transaction
    history: list[HistoricalTxn] = []
