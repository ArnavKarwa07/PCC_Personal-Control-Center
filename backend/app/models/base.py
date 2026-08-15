"""Base model for all PCC entities with UUID primary keys and soft deletion."""

import uuid

from sqlalchemy import Column, DateTime, Uuid, func

from app.core.database import Base


class BaseModel(Base):
    """Abstract base model implementing common audit fields and soft deletion."""

    __abstract__ = True

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime(timezone=True), nullable=True, default=None)
