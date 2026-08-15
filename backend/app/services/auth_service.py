"""Authentication and user management business logic."""

from typing import Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictException, UnauthorizedException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserUpdateRequest


class AuthService:
    """Service handling user registration, authentication, and profile updates."""

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Fetch user by email where not deleted."""
        return db.query(User).filter(User.email == email.lower().strip(), User.deleted_at.is_(None)).first()

    @staticmethod
    def register_user(db: Session, request: RegisterRequest) -> Tuple[User, str]:
        """Register a new user account and generate an access token."""
        normalized_email = request.email.lower().strip()
        existing = db.query(User).filter(User.email == normalized_email, User.deleted_at.is_(None)).first()
        if existing:
            raise ConflictException(
                message="An account with this email already exists.",
                code="EMAIL_ALREADY_EXISTS",
            )

        hashed_pwd = hash_password(request.password)
        new_user = User(
            email=normalized_email,
            hashed_password=hashed_pwd,
            full_name=request.full_name,
        )
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        token = create_access_token(data={"sub": str(new_user.id), "email": new_user.email})
        return new_user, token

    @staticmethod
    def authenticate_user(db: Session, request: LoginRequest) -> Tuple[User, str]:
        """Verify user credentials and issue an access token."""
        normalized_email = request.email.lower().strip()
        user = db.query(User).filter(User.email == normalized_email, User.deleted_at.is_(None)).first()
        if not user or not verify_password(request.password, user.hashed_password):
            raise UnauthorizedException(
                message="Invalid email or password.",
                code="INVALID_CREDENTIALS",
            )

        if not user.is_active:
            raise UnauthorizedException(
                message="This account has been deactivated.",
                code="USER_INACTIVE",
            )

        token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return user, token

    @staticmethod
    def update_user_profile(db: Session, user: User, updates: UserUpdateRequest) -> User:
        """Update authenticated user settings."""
        update_data = updates.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(user, field, value)

        db.commit()
        db.refresh(user)
        return user


auth_service = AuthService()
