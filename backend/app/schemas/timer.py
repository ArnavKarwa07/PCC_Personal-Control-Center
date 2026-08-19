"""Pydantic schemas for Timer management."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.timer import TimerState, TimerType
from app.schemas.base import PaginationMeta


class TimerBase(BaseModel):
    """Base fields for Timer."""

    label: Optional[str] = Field(None, max_length=255, description="Timer label")
    timer_type: TimerType = Field(TimerType.COUNTDOWN, description="Timer type: countdown, stopwatch, pomodoro")
    duration_seconds: Optional[int] = Field(None, ge=0, strict=True, description="Total duration in seconds")
    remaining_seconds: Optional[int] = Field(None, ge=0, strict=True, description="Remaining seconds left")
    preset_name: Optional[str] = Field(None, max_length=100, description="Preset configuration label")


class TimerCreate(TimerBase):
    """Payload for creating a new timer."""

    pass


class TimerUpdate(BaseModel):
    """Payload for updating timer metadata."""

    label: Optional[str] = Field(None, max_length=255)
    timer_type: Optional[TimerType] = None
    duration_seconds: Optional[int] = Field(None, ge=0)
    remaining_seconds: Optional[int] = Field(None, ge=0)
    preset_name: Optional[str] = Field(None, max_length=100)


class TimerStateAction(BaseModel):
    """Payload for executing state transitions on a timer."""

    action: str = Field(..., pattern="^(start|pause|reset|complete)$", description="Action to perform: start, pause, reset, complete")
    remaining_seconds: Optional[int] = Field(None, ge=0, description="Current remaining seconds when pausing or updating")


class TimerResponse(TimerBase):
    """Response representation of a Timer entity."""

    id: uuid.UUID
    user_id: uuid.UUID
    status: TimerState
    started_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class TimerListResponse(BaseModel):
    """Paginated list response for timers."""

    data: List[TimerResponse]
    meta: PaginationMeta
