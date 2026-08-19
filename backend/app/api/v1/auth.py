"""Authentication endpoints for user registration, authentication, and profile access."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse
from app.services.auth_service import auth_service

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", operation_id="registerUser", status_code=status.HTTP_201_CREATED)
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


@router.post("/login", operation_id="loginUser")
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


@router.post("/logout", operation_id="logoutUser")
def logout():
    """Logout endpoint (stateless JWT client-side eviction)."""
    return {
        "data": {
            "message": "Successfully logged out.",
        }
    }
