from datetime import datetime


def parse_ts(ts: str) -> datetime:
    """Parse an ISO timestamp, treating 'Z' as UTC."""
    return datetime.fromisoformat(ts.replace('Z', '+00:00'))
