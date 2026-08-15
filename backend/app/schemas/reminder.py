"""Pydantic schemas for Reminder management."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.reminder import ReminderStatus
from app.schemas.base import PaginationMeta


class ReminderBase(BaseModel):
    """Base fields for Reminder."""

    title: str = Field(..., min_length=1, max_length=500, description="Reminder title")
    description: Optional[str] = Field(None, description="Detailed reminder description")
    remind_at: datetime = Field(..., description="Timestamp when reminder should trigger")
    is_recurring: bool = Field(False, description="Whether this reminder repeats")


class ReminderCreate(ReminderBase):
    """Payload for creating a new reminder."""

    pass


class ReminderUpdate(BaseModel):
    """Payload for updating an existing reminder."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    remind_at: Optional[datetime] = None
    is_recurring: Optional[bool] = None
    status: Optional[ReminderStatus] = None
    snoozed_until: Optional[datetime] = None


class ReminderSnoozeRequest(BaseModel):
    """Payload for snoozing a reminder."""

    snooze_minutes: Optional[int] = Field(10, ge=1, le=1440, description="Minutes to snooze")
    snooze_until: Optional[datetime] = Field(None, description="Specific timestamp to snooze until")


class ReminderResponse(ReminderBase):
    """Response representation of a Reminder entity."""

    id: uuid.UUID
    user_id: uuid.UUID
    status: ReminderStatus
    snoozed_until: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ReminderListResponse(BaseModel):
    """Paginated list response for reminders."""

    data: List[ReminderResponse]
    meta: PaginationMeta
