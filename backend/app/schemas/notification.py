"""Pydantic schemas for Notification management."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import (
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationType,
)
from app.schemas.base import PaginationMeta


class NotificationBase(BaseModel):
    """Base fields for Notification."""

    title: str = Field(..., min_length=1, max_length=500, description="Notification summary headline")
    message: Optional[str] = Field(None, description="Detailed notification message content")
    type: NotificationType = Field(NotificationType.SYSTEM, description="Notification category")
    channel: NotificationChannel = Field(NotificationChannel.IN_APP, description="Delivery channel")
    entity_type: Optional[str] = Field(None, max_length=50, description="Associated entity type (e.g. reminder, task)")
    entity_id: Optional[uuid.UUID] = Field(None, description="Associated entity UUID")


class NotificationCreate(NotificationBase):
    """Payload for creating a notification."""

    pass


class NotificationResponse(NotificationBase):
    """Response representation of a Notification entity."""

    id: uuid.UUID
    status: NotificationDeliveryStatus
    sent_at: Optional[datetime] = None
    read_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    """Paginated list response for notifications."""

    data: List[NotificationResponse]
    meta: PaginationMeta
