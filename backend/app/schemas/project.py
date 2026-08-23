"""Project, ProjectMember, and Kanban Board Pydantic schemas."""

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.project import ProjectPriority, ProjectStatus
from app.schemas.base import PaginationMeta

# ---------------------------------------------------------------------------
# Project Member Schemas
# ---------------------------------------------------------------------------

class ProjectMemberCreate(BaseModel):
    """Payload to add a member/contact to a project."""

    contact_id: uuid.UUID
    role: Optional[str] = Field(None, max_length=100)


class ProjectMemberResponse(BaseModel):
    """Serialized project member."""

    id: uuid.UUID
    project_id: uuid.UUID
    contact_id: uuid.UUID
    role: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------------------
# Project Schemas
# ---------------------------------------------------------------------------

class ProjectBase(BaseModel):
    """Base project attributes."""

    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.PLANNED
    priority: Optional[ProjectPriority] = ProjectPriority.NONE
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    progress: Optional[float] = Field(0.0, ge=0.0, le=100.0)


class ProjectCreate(BaseModel):
    """Payload for creating a new project."""

    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = ProjectStatus.PLANNED
    priority: Optional[ProjectPriority] = ProjectPriority.NONE
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    progress: Optional[float] = Field(0.0, ge=0.0, le=100.0)
    tags: Optional[List[str]] = None


class ProjectUpdate(BaseModel):
    """Payload for updating an existing project."""

    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    priority: Optional[ProjectPriority] = None
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    tags: Optional[List[str]] = None


class ProjectResponse(BaseModel):
    """Serialized project object."""

    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    priority: ProjectPriority
    start_date: Optional[date] = None
    deadline: Optional[date] = None
    progress: float = 0.0
    created_at: datetime
    updated_at: datetime
    tags: List[str] = []
    members: List[ProjectMemberResponse] = []
    task_count: int = 0
    completed_task_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ProjectListResponse(BaseModel):
    """Paginated project list response."""

    data: List[ProjectResponse]
    meta: PaginationMeta


# ---------------------------------------------------------------------------
# Kanban Board Schemas
# ---------------------------------------------------------------------------

class BoardCardTaskSummary(BaseModel):
    """Summary of task embedded in a board card."""

    id: uuid.UUID
    title: str
    status: str
    priority: str
    due_date: Optional[date] = None

    model_config = ConfigDict(from_attributes=True)


class BoardCardCreate(BaseModel):
    """Payload for adding a task card to a board column."""

    column_id: uuid.UUID
    task_id: uuid.UUID
    position: Optional[int] = 0


class BoardCardMove(BaseModel):
    """Payload for moving/reordering a board card."""

    column_id: Optional[uuid.UUID] = None
    position: int = 0


class BoardCardResponse(BaseModel):
    """Serialized board card."""

    id: uuid.UUID
    column_id: uuid.UUID
    task_id: uuid.UUID
    position: int
    task: Optional[BoardCardTaskSummary] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BoardColumnCreate(BaseModel):
    """Payload for creating a column in a board."""

    name: str = Field(..., min_length=1, max_length=255)
    position: Optional[int] = None
    color: Optional[str] = Field(None, max_length=20)


class BoardColumnResponse(BaseModel):
    """Serialized board column with nested cards."""

    id: uuid.UUID
    board_id: uuid.UUID
    name: str
    position: int
    color: Optional[str] = None
    cards: List[BoardCardResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class BoardCreate(BaseModel):
    """Payload for creating a Kanban board."""

    name: str = Field(..., min_length=1, max_length=255)
    project_id: Optional[uuid.UUID] = None
    columns: Optional[List[str]] = None


class BoardResponse(BaseModel):
    """Serialized board with all columns and cards."""

    id: uuid.UUID
    project_id: Optional[uuid.UUID] = None
    name: str
    columns: List[BoardColumnResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
