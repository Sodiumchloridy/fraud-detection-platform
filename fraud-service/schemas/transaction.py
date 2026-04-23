from datetime import timedelta, datetime, timezone
from pydantic import ConfigDict
from typing import Optional

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
    def _local_dt(self) -> datetime:
        """UTC datetime adjusted for longitude-based timezone offset."""
        if self.timestamp:
            utc_dt = parse_ts(self.timestamp)
        else:
            utc_dt = datetime.now(timezone.utc)
        if self.longitude is not None:
            return utc_dt + timedelta(hours=round(self.longitude / 15))
        return utc_dt

    @property
    def local_hour_of_day(self) -> int:
        """Hour 0-23, adjusted for longitude-based timezone."""
        return self._local_dt.hour

    @property
    def local_day_of_week(self) -> int:
        """0=Monday ... 6=Sunday, adjusted for longitude-based timezone."""
        return self._local_dt.weekday()


class HistoricalTransaction(BaseSchema):
    model_config = ConfigDict(extra='allow')
    amount: float
    timestamp: str
    latitude: Optional[float] = 0.0
    longitude: Optional[float] = 0.0
    merchant: Optional[str] = ''
    device_id: Optional[str] = ''
    purchaser_email_domain: Optional[str] = ''
