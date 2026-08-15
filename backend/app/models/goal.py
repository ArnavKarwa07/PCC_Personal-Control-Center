"""Goal and GoalMilestone models."""

import enum

from sqlalchemy import Column, Date, DateTime, Enum, Float, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class GoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class Goal(BaseModel):
    """Goal entity with self-referential parent/child goal hierarchies."""

    __tablename__ = "goals"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    parent_goal_id = Column(Uuid(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True)
    time_period = Column(String(100), nullable=True)
    status = Column(Enum(GoalStatus, name="goal_status", values_callable=lambda obj: [e.value for e in obj]), default=GoalStatus.NOT_STARTED, nullable=False)
    progress = Column(Float, default=0.0, nullable=False)

    milestones = relationship("GoalMilestone", back_populates="goal", cascade="all, delete-orphan")
    parent_goal = relationship("Goal", remote_side="Goal.id", backref="sub_goals")


class GoalMilestone(BaseModel):
    """Milestone progress checkpoint for a goal."""

    __tablename__ = "goal_milestones"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    goal_id = Column(Uuid(as_uuid=True), ForeignKey("goals.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    target_date = Column(Date, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    goal = relationship("Goal", back_populates="milestones")
