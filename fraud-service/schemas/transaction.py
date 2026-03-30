from pydantic import ConfigDict
from typing import Optional
import time

from .base import BaseSchema
from .utils import parse_ts


class Transaction(BaseSchema):
    card_number: str
    amount: float
    category: str = ''
    channel: str = 'in_store'
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''

    # Kaggle-style fields from IEEE-CIS data
    card_network: Optional[str] = ''
    card_type: Optional[str] = ''
    card_issuing_country: Optional[int] = None
    billing_country_code: Optional[int] = None
    billing_zip_code: Optional[int] = None
    purchaser_email_domain: Optional[str] = ''
    recipient_email_domain: Optional[str] = ''
    device_type: Optional[str] = ''
    device_info: Optional[str] = ''

    timestamp: Optional[str] = None

    @property
    def local_hour_of_day(self) -> int:
        if self.timestamp:
            utc_dt = parse_ts(self.timestamp)
            if self.longitude is not None:
                return (utc_dt.hour + round(self.longitude / 15)) % 24
            return utc_dt.hour
        return int((time.time() % 86400) // 3600)


class HistoricalTransaction(BaseSchema):
    model_config = ConfigDict(extra='allow')

    amount: float
    timestamp: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''
    purchaser_email_domain: Optional[str] = ''
