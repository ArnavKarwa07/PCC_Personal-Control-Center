"""Idea Pydantic schemas for idea capture and entity promotion."""

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.idea import IdeaStatus
from app.schemas.base import PaginationMeta


class IdeaBase(BaseModel):
    """Base idea attributes."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[IdeaStatus] = IdeaStatus.CAPTURED


class IdeaCreate(BaseModel):
    """Payload for capturing a new idea."""

    title: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[IdeaStatus] = IdeaStatus.CAPTURED


class IdeaUpdate(BaseModel):
    """Payload for updating an existing idea."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    status: Optional[IdeaStatus] = None


class IdeaPromoteRequest(BaseModel):
    """Payload for promoting an idea into a Project or Task."""

    promote_to: str = Field(..., pattern="^(project|task)$", description="Target entity type: 'project' or 'task'")
    target_name: Optional[str] = Field(None, description="Optional custom title/name for created entity")
    target_description: Optional[str] = Field(None, description="Optional custom description")
    priority: Optional[str] = Field("medium", description="Priority level for created entity")
    due_date: Optional[date] = Field(None, description="Due date if promoting to task")
    deadline: Optional[date] = Field(None, description="Deadline if promoting to project")


class IdeaResponse(BaseModel):
    """Serialized idea response."""

    id: uuid.UUID
    title: str
    description: Optional[str] = None
    category: Optional[str] = None
    status: IdeaStatus
    promoted_to_type: Optional[str] = None
    promoted_to_id: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class IdeaListResponse(BaseModel):
    """Paginated ideas list response."""

    data: List[IdeaResponse]
    meta: PaginationMeta
