"""User and User Settings database models."""

import uuid

from sqlalchemy import Boolean, Column, DateTime, String, Uuid, func

from app.core.database import Base


class User(Base):
    """User account entity."""

    __tablename__ = "users"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    timezone = Column(String(50), default="UTC", nullable=False)
    date_format = Column(String(20), default="YYYY-MM-DD", nullable=False)
    time_format = Column(String(10), default="24h", nullable=False)
    theme = Column(String(20), default="dark", nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)
