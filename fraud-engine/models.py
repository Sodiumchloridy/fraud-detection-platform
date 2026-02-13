from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import time


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
            utc_dt = datetime.fromisoformat(self.timestamp.replace('Z', '+00:00'))
            local_hour = (utc_dt.hour + round(self.longitude / 15)) % 24
            return local_hour
        return int((time.time() % 86400) // 3600)
