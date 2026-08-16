"""Learning Pydantic schemas for courses, books, tutorials, and skill tracking."""

import uuid
from datetime import datetime
from typing import Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.learning import LearningResourceType, LearningStatus
from app.schemas.base import PaginationMeta


class LearningItemBase(BaseModel):
    """Base schema for learning items."""

    title: str = Field(..., min_length=1, max_length=500)
    resource_type: LearningResourceType = Field(default=LearningResourceType.COURSE)
    url: Optional[str] = Field(None, max_length=1000)
    status: LearningStatus = Field(default=LearningStatus.SAVED)
    progress: float = Field(default=0.0, ge=0.0, le=100.0)
    notes: Optional[str] = None


class LearningItemCreate(LearningItemBase):
    """Payload for creating a new learning item."""

    pass


class LearningItemUpdate(BaseModel):
    """Payload for updating an existing learning item."""

    title: Optional[str] = Field(None, min_length=1, max_length=500)
    resource_type: Optional[LearningResourceType] = None
    url: Optional[str] = Field(None, max_length=1000)
    status: Optional[LearningStatus] = None
    progress: Optional[float] = Field(None, ge=0.0, le=100.0)
    notes: Optional[str] = None


class LearningItemResponse(LearningItemBase):
    """Serialized learning item response."""

    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class LearningItemListResponse(BaseModel):
    """Paginated list of learning items."""

    data: List[LearningItemResponse]
    meta: PaginationMeta


class LearningStatsResponse(BaseModel):
    """Aggregate statistics for learning progress."""

    total: int
    completed: int
    in_progress: int
    saved: int
    planned: int
    practicing: int
    by_type: Dict[str, int]
    average_progress: float

    model_config = ConfigDict(from_attributes=True)
