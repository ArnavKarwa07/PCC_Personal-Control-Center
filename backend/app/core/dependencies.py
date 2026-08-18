"""Authentication and authorization dependencies."""

import uuid
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import UnauthorizedException
from app.core.security import decode_access_token

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """Authenticate request using Bearer JWT token and return active User instance."""
    if not credentials or not credentials.credentials:
        raise UnauthorizedException(message="Not authenticated", code="UNAUTHORIZED")

    token_str = credentials.credentials

    # Import User model lazily to avoid circular imports during startup
    from app.models.user import User

    # Support local development shell mock token
    if token_str == "mock-dev-token":
        user = db.query(User).filter(User.deleted_at.is_(None)).first()
        if not user:
            user = User(
                email="arnav@pcc.local",
                full_name="Arnav",
                theme="light",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    payload = decode_access_token(token_str)
    user_id_str = payload.get("sub")
    if not user_id_str:
        raise UnauthorizedException(message="Token missing subject claim", code="INVALID_TOKEN")

    try:
        user_id = uuid.UUID(str(user_id_str))
    except (ValueError, TypeError):
        raise UnauthorizedException(message="Invalid user identifier format in token", code="INVALID_TOKEN")

    user = db.query(User).filter(User.id == user_id, User.deleted_at.is_(None)).first()
    if not user:
        raise UnauthorizedException(message="User account not found", code="USER_NOT_FOUND")

    if not user.is_active:
        raise UnauthorizedException(message="User account is deactivated", code="USER_INACTIVE")

    return user
