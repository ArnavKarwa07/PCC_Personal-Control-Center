"""Users management endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import UserResponse, UserUpdateRequest
from app.services.auth_service import auth_service

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/get_users_me", operation_id="get_users_me", summary="Get Users Me")
def get_users_me(current_user: User = Depends(get_current_user)):
    """Fetch profile of current authenticated user."""
    user_data = UserResponse.model_validate(current_user)
    return {
        "data": user_data.model_dump(),
    }


@router.patch("/update_users_me", operation_id="update_users_me", summary="Update Users Me")
def update_users_me(
    updates: UserUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update profile of current authenticated user."""
    updated_user = auth_service.update_user_profile(db, current_user, updates)
    user_data = UserResponse.model_validate(updated_user)
    return {
        "data": user_data.model_dump(),
    }
