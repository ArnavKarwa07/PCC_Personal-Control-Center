"""Authentication endpoints for user registration, authentication, and profile access."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse, UserUpdateRequest
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    """Register a new user account."""
    user, token = auth_service.register_user(db, request)
    user_data = UserResponse.model_validate(user)
    return {
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": user_data.model_dump(),
        }
    }


@router.post("/login")
def login(request: LoginRequest, db: Session = Depends(get_db)):
    """Authenticate with email and password."""
    user, token = auth_service.authenticate_user(db, request)
    user_data = UserResponse.model_validate(user)
    return {
        "data": {
            "access_token": token,
            "token_type": "bearer",
            "user": user_data.model_dump(),
        }
    }


@router.post("/logout")
def logout():
    """Logout endpoint (stateless JWT client-side eviction)."""
    return {
        "data": {
            "message": "Successfully logged out.",
        }
    }


@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    """Get profile of authenticated user."""
    user_data = UserResponse.model_validate(current_user)
    return {
        "data": user_data.model_dump(),
    }


@router.patch("/me")
def update_current_user_profile(
    updates: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile attributes for authenticated user."""
    updated_user = auth_service.update_user_profile(db, current_user, updates)
    user_data = UserResponse.model_validate(updated_user)
    return {
        "data": user_data.model_dump(),
    }
