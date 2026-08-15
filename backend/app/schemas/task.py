"""Task schemas for CRUD operations, recurrence, and filtering."""

import uuid
from datetime import date, datetime, time
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.task import RecurrencePattern, TaskPriority, TaskStatus
from app.schemas.base import PaginationMeta


class TaskRecurrenceCreate(BaseModel):
    """Payload for configuring task recurrence rules."""

    pattern: RecurrencePattern
    interval: Optional[int] = Field(1, ge=1)
    days_of_week: Optional[str] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    end_date: Optional[date] = None
    max_occurrences: Optional[int] = Field(None, ge=1)


class TaskRecurrenceResponse(BaseModel):
    """Serialized task recurrence configuration."""

    id: uuid.UUID
    task_id: uuid.UUID
    pattern: RecurrencePattern
    interval: int
    days_of_week: Optional[str] = None
    day_of_month: Optional[int] = None
    end_date: Optional[date] = None
    max_occurrences: Optional[int] = None
    next_occurrence: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class TaskBase(BaseModel):
    """Base task attributes."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.INBOX
    priority: Optional[TaskPriority] = TaskPriority.NONE
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    project_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    estimated_minutes: Optional[int] = Field(None, ge=0)
    actual_minutes: Optional[int] = Field(None, ge=0)


class TaskCreate(BaseModel):
    """Payload for creating a new task."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = TaskStatus.INBOX
    priority: Optional[TaskPriority] = TaskPriority.NONE
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    project_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    estimated_minutes: Optional[int] = Field(None, ge=0)
    tags: Optional[List[str]] = None
    recurrence: Optional[TaskRecurrenceCreate] = None


class TaskUpdate(BaseModel):
    """Payload for updating an existing task."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[TaskStatus] = None
    priority: Optional[TaskPriority] = None
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    reminder_at: Optional[datetime] = None
    project_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    estimated_minutes: Optional[int] = Field(None, ge=0)
    actual_minutes: Optional[int] = Field(None, ge=0)
    completed_at: Optional[datetime] = None
    tags: Optional[List[str]] = None
    recurrence: Optional[TaskRecurrenceCreate] = None


class TaskResponse(BaseModel):
    """Serialized Task object."""

    id: uuid.UUID
    user_id: uuid.UUID
    title: str
    description: Optional[str] = None
    status: TaskStatus
    priority: TaskPriority
    due_date: Optional[date] = None
    due_time: Optional[time] = None
    reminder_at: Optional[datetime] = None
    project_id: Optional[uuid.UUID] = None
    goal_id: Optional[uuid.UUID] = None
    estimated_minutes: Optional[int] = None
    actual_minutes: Optional[int] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    recurrence: Optional[TaskRecurrenceResponse] = None

    model_config = ConfigDict(from_attributes=True)


class TaskListResponse(BaseModel):
    """Paginated task list response."""

    data: List[TaskResponse]
    meta: PaginationMeta
