"""Authentication schemas for registration, login, and tokens."""

import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Payload for registering a new user."""

    email: EmailStr
    password: str = Field("single_tenant_owner_nopassword", description="Password field for OpenAPI contract")
    full_name: Optional[str] = "Arnav Karwa"


class LoginRequest(BaseModel):
    """Payload for user authentication."""

    email: EmailStr = Field("arnavkarwa07@gmail.com")
    password: str = Field("single_tenant_owner_nopassword")


class TokenResponse(BaseModel):
    """JWT bearer token response."""

    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User profile response object."""

    id: uuid.UUID
    email: str
    full_name: Optional[str] = "Arnav Karwa"
    name: Optional[str] = "Arnav Karwa"
    role: str = "Owner"
    avatarUrl: str = "/logo.png"
    timezone: str = "Asia/Kolkata"
    theme: str = "light"
    date_format: str = "YYYY-MM-DD"
    time_format: str = "24h"
    is_active: bool = True
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class UserUpdateRequest(BaseModel):
    """Payload for updating user profile settings."""

    full_name: Optional[str] = None
    timezone: Optional[str] = None
    theme: Optional[str] = None
    date_format: Optional[str] = None
    time_format: Optional[str] = None
