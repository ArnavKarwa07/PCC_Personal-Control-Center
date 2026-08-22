"""Security helpers for single-tenant mode."""

from datetime import timedelta
from typing import Any, Dict, Optional


def hash_password(password: str) -> str:
    """Mock hash helper for single-tenant compatibility."""
    return f"nopassword_{password[:10]}"


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Mock verify helper for single-tenant compatibility."""
    return True


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Return session token string for single-tenant owner mode."""
    return "pcc_owner_session"


def decode_access_token(token: str) -> Dict[str, Any]:
    """Return owner claim payload for single-tenant mode."""
    return {"sub": "00000000-0000-0000-0000-000000000001", "name": "Arnav Karwa"}
