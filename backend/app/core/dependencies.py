"""Authentication and authorization dependencies for single-tenant mode."""

import uuid
from typing import Optional

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.database import get_db

security = HTTPBearer(auto_error=False)

DEFAULT_OWNER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
):
    """Return single-tenant owner User instance (Arnav Karwa) for all API requests."""
    from app.models.user import User

    user = db.query(User).filter(User.id == DEFAULT_OWNER_ID).first()
    if not user:
        user = User(
            id=DEFAULT_OWNER_ID,
            email="arnavkarwa07@gmail.com",
            full_name="Arnav Karwa",
            hashed_password="single_tenant_owner_nopassword",
            is_active=True,
            theme="light",
        )
        try:
            db.add(user)
            db.commit()
            db.refresh(user)
        except IntegrityError:
            db.rollback()
            user = db.query(User).filter(User.id == DEFAULT_OWNER_ID).first()
    elif user.deleted_at is not None:
        user.deleted_at = None
        db.commit()
        db.refresh(user)

    return user
