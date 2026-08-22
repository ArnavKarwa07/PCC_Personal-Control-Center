"""Authentication endpoints for single-tenant mode."""


from fastapi import APIRouter, Depends, status

from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import LoginRequest, RegisterRequest, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", operation_id="get_current_owner", summary="Get Owner Profile")
def me(current_user: User = Depends(get_current_user)):
    """Return the single-tenant owner profile (Arnav Karwa)."""
    user_data = UserResponse.model_validate(current_user)
    return {
        "data": {
            "access_token": "pcc_owner_session",
            "token_type": "bearer",
            "user": user_data.model_dump(mode="json"),
        }
    }


@router.post("/login_user", operation_id="login_user", summary="Login Owner")
def login(request: LoginRequest, current_user: User = Depends(get_current_user)):
    """Authenticate owner session."""
    user_data = UserResponse.model_validate(current_user)
    return {
        "data": {
            "access_token": "pcc_owner_session",
            "token_type": "bearer",
            "user": user_data.model_dump(mode="json"),
        }
    }


@router.post("/register_user", operation_id="register_user", status_code=status.HTTP_200_OK, summary="Register Owner")
def register(request: RegisterRequest, current_user: User = Depends(get_current_user)):
    """Register owner session."""
    user_data = UserResponse.model_validate(current_user)
    return {
        "data": {
            "access_token": "pcc_owner_session",
            "token_type": "bearer",
            "user": user_data.model_dump(mode="json"),
        }
    }


@router.post("/logout_user", operation_id="logout_user", summary="Logout Owner")
def logout():
    """Stateless logout endpoint for owner mode."""
    return {
        "data": {
            "message": "PCC Owner session active.",
        }
    }
