"""Authentication and user management business logic for single-tenant mode."""

import uuid
from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserUpdateRequest

DEFAULT_OWNER_ID = uuid.UUID("00000000-0000-0000-0000-000000000001")


class AuthService:
    """Service handling user profile updates in single-tenant owner mode."""

    @staticmethod
    def get_owner(db: Session) -> User:
        """Fetch or create default owner user."""
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
            db.add(user)
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch user by email where not deleted."""
        return db.query(User).filter(User.email == email.lower().strip(), User.deleted_at.is_(None)).first()

    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> Tuple[User, str]:
        """Return owner user profile and session token."""
        user = AuthService.get_owner(db)
        return user, "pcc_owner_session"

    @staticmethod
    def authenticate_user(db: Session, request: LoginRequest) -> Tuple[User, str]:
        """Return owner user profile and session token."""
        user = AuthService.get_owner(db)
        return user, "pcc_owner_session"

    @staticmethod
    def update_user_profile(db: Session, user: User, updates: UserUpdateRequest) -> User:
        """Update owner user profile with field whitelist protection."""
        allowed_fields = {"full_name", "timezone", "theme", "date_format", "time_format"}
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field in allowed_fields and value is not None:
                setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user


auth_service = AuthService()
