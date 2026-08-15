"""Pydantic schemas for Goals, OKRs, and Milestones."""

import uuid
from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.goal import GoalStatus


class MilestoneBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    target_date: Optional[date] = None


class MilestoneCreate(MilestoneBase):
    pass


class MilestoneRead(MilestoneBase):
    id: uuid.UUID
    goal_id: uuid.UUID
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class GoalBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    parent_goal_id: Optional[uuid.UUID] = None
    time_period: Optional[str] = Field(default=None, max_length=100)
    status: GoalStatus = Field(default=GoalStatus.NOT_STARTED)
    progress: float = Field(default=0.0, ge=0.0, le=100.0)


class GoalCreate(GoalBase):
    milestones: List[MilestoneCreate] = Field(default_factory=list)


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    parent_goal_id: Optional[uuid.UUID] = None
    time_period: Optional[str] = None
    status: Optional[GoalStatus] = None
    progress: Optional[float] = Field(default=None, ge=0.0, le=100.0)


class GoalRead(GoalBase):
    id: uuid.UUID
    user_id: uuid.UUID
    milestones: List[MilestoneRead] = Field(default_factory=list)

    class Config:
        from_attributes = True
