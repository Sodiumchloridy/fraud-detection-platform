from pydantic import ConfigDict
from typing import Optional
import time

from .base import BaseSchema
from .utils import parse_ts


class Transaction(BaseSchema):
    card_number: str
    amount: float
    category: str
    channel: str = 'in_store'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''
    
    # New Kaggle-style data passed from Spring Boot
    cardNetwork: Optional[str] = ''
    cardType: Optional[str] = ''
    billingCountry: Optional[str] = ''
    emailDomain: Optional[str] = ''
    deviceType: Optional[str] = ''
    
    timestamp: Optional[str] = None

    @property
    def local_hour_of_day(self) -> int:
        """Calculate hour in user's timezone based on longitude (rough estimate)"""
        if self.timestamp and self.longitude is not None:
            utc_dt = parse_ts(self.timestamp)
            return (utc_dt.hour + round(self.longitude / 15)) % 24
        return int((time.time() % 86400) // 3600)


class HistoricalTransaction(BaseSchema):
    model_config = ConfigDict(extra='allow')

    amount: float
    timestamp: str
    latitude: float = 0.0
    longitude: float = 0.0
    merchant: str = ''
    device_id: str = ''
