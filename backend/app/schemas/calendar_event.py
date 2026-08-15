"""Calendar event Pydantic schemas for scheduling and time management."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.calendar_event import CalendarEventType
from app.schemas.base import PaginationMeta


class CalendarEventBase(BaseModel):
    """Base calendar event attributes."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    event_type: Optional[CalendarEventType] = CalendarEventType.EVENT
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = False
    location: Optional[str] = Field(None, max_length=500)
    source: Optional[str] = Field("pcc", max_length=50)
    external_id: Optional[str] = Field(None, max_length=255)


class CalendarEventCreate(BaseModel):
    """Payload for creating a calendar event."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    event_type: Optional[CalendarEventType] = CalendarEventType.EVENT
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = False
    location: Optional[str] = Field(None, max_length=500)
    source: Optional[str] = Field("pcc", max_length=50)
    external_id: Optional[str] = Field(None, max_length=255)


class CalendarEventUpdate(BaseModel):
    """Payload for updating an existing calendar event."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    event_type: Optional[CalendarEventType] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    all_day: Optional[bool] = None
    location: Optional[str] = Field(None, max_length=500)
    source: Optional[str] = Field(None, max_length=50)
    external_id: Optional[str] = Field(None, max_length=255)


class CalendarEventResponse(BaseModel):
    """Serialized calendar event response."""

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    event_type: CalendarEventType
    start_time: datetime
    end_time: Optional[datetime] = None
    all_day: bool = False
    location: Optional[str] = None
    source: str = "pcc"
    external_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class CalendarEventListResponse(BaseModel):
    """Paginated calendar events list response."""

    data: List[CalendarEventResponse]
    meta: PaginationMeta
