"""Pydantic schemas for Alarm management."""

import datetime as dt
import uuid
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.base import PaginationMeta


class AlarmBase(BaseModel):
    """Base fields for Alarm."""

    label: Optional[str] = Field(None, max_length=255, description="Alarm label")
    time: dt.time = Field(..., description="Alarm trigger time (HH:MM:SS)")
    days_of_week: Optional[str] = Field(None, max_length=50, description="Comma-separated days e.g. MO,TU,WE")
    is_recurring: bool = Field(False, description="Whether alarm repeats weekly on days_of_week")
    is_enabled: bool = Field(True, description="Whether alarm is actively armed")


class AlarmCreate(AlarmBase):
    """Payload for creating a new alarm."""

    pass


class AlarmUpdate(BaseModel):
    """Payload for updating an alarm."""

    label: Optional[str] = Field(None, max_length=255)
    time: Optional[dt.time] = None
    days_of_week: Optional[str] = None
    is_recurring: Optional[bool] = None
    is_enabled: Optional[bool] = None


class AlarmToggleRequest(BaseModel):
    """Payload for toggling alarm state explicitly."""

    is_enabled: Optional[bool] = Field(
        None, description="Explicit enable/disable state; if omitted, toggles current value"
    )


class AlarmResponse(AlarmBase):
    """Response representation of an Alarm entity."""

    id: uuid.UUID
    created_at: dt.datetime
    updated_at: dt.datetime
    deleted_at: Optional[dt.datetime] = None

    model_config = ConfigDict(from_attributes=True)


class AlarmListResponse(BaseModel):
    """Paginated list response for alarms."""

    data: List[AlarmResponse]
    meta: PaginationMeta
