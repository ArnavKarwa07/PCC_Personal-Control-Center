"""Review Pydantic schemas for weekly and periodic retrospectives."""

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.review import ReviewSection, ReviewStatus
from app.schemas.base import PaginationMeta


class ReviewEntryBase(BaseModel):
    """Base review entry attributes."""

    section: ReviewSection
    content: Optional[str] = None
    sort_order: int = Field(default=0, ge=0)


class ReviewEntryCreate(BaseModel):
    """Payload for creating or updating a review entry."""

    section: ReviewSection
    content: Optional[str] = None
    sort_order: int = Field(default=0, ge=0)


class ReviewEntryUpdate(BaseModel):
    """Payload for updating a review entry."""

    content: Optional[str] = None
    sort_order: Optional[int] = Field(default=None, ge=0)


class ReviewEntryResponse(ReviewEntryBase):
    """Serialized review entry response."""

    id: uuid.UUID
    review_id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ReviewBase(BaseModel):
    """Base review attributes."""

    week_start: date
    week_end: date
    status: ReviewStatus = Field(default=ReviewStatus.DRAFT)


class ReviewCreate(BaseModel):
    """Payload for creating a new review session."""

    week_start: date
    week_end: date
    status: ReviewStatus = Field(default=ReviewStatus.DRAFT)
    entries: Optional[List[ReviewEntryCreate]] = None


class ReviewUpdate(BaseModel):
    """Payload for modifying a review session."""

    week_start: Optional[date] = None
    week_end: Optional[date] = None
    status: Optional[ReviewStatus] = None
    completed_at: Optional[datetime] = None
    entries: Optional[List[ReviewEntryCreate]] = None


class ReviewResponse(ReviewBase):
    """Serialized review response with nested section entries."""

    id: uuid.UUID
    user_id: uuid.UUID
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    entries: List[ReviewEntryResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class ReviewListResponse(BaseModel):
    """Paginated list of reviews response."""

    data: List[ReviewResponse]
    meta: PaginationMeta


class ReviewStatsResponse(BaseModel):
    """Statistical summary of review performance and streak metrics."""

    total_reviews: int
    completed_reviews: int
    draft_reviews: int
    completion_rate: float
    streak_weeks: int
