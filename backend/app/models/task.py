"""Task and associated task recurrence, dependency, and tag models."""

import enum

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    String,
    Text,
    Time,
    Uuid,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base
from app.models.base import BaseModel


class TaskStatus(str, enum.Enum):
    INBOX = "inbox"
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    WAITING = "waiting"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    NONE = "none"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class RecurrencePattern(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"
    CUSTOM = "custom"


class TaskTag(Base):
    """Many-to-many junction between tasks and tags."""

    __tablename__ = "task_tags"

    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    tag_id = Column(Uuid(as_uuid=True), ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TaskDependency(Base):
    """Task dependency graph table."""

    __tablename__ = "task_dependencies"

    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    depends_on_task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class TaskRecurrence(BaseModel):
    """Recurrence rules defining periodic generation of task instances."""

    __tablename__ = "task_recurrences"

    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), unique=True, nullable=False)
    pattern = Column(
        Enum(RecurrencePattern, name="recurrence_pattern", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    interval = Column(Integer, default=1, nullable=False)
    days_of_week = Column(String(50), nullable=True)
    day_of_month = Column(Integer, nullable=True)
    end_date = Column(Date, nullable=True)
    max_occurrences = Column(Integer, nullable=True)
    next_occurrence = Column(Date, nullable=True)

    task = relationship("Task", back_populates="recurrence")


class Task(BaseModel):
    """Core Task entity for personal productivity and execution tracking."""

    __tablename__ = "tasks"

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    status = Column(
        Enum(TaskStatus, name="task_status", values_callable=lambda obj: [e.value for e in obj]),
        default=TaskStatus.INBOX,
        nullable=False,
        index=True,
    )
    priority = Column(
        Enum(TaskPriority, name="task_priority", values_callable=lambda obj: [e.value for e in obj]),
        default=TaskPriority.NONE,
        nullable=False,
        index=True,
    )
    due_date = Column(Date, nullable=True, index=True)
    due_time = Column(Time, nullable=True)
    reminder_at = Column(DateTime(timezone=True), nullable=True)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True, index=True)
    goal_id = Column(Uuid(as_uuid=True), ForeignKey("goals.id", ondelete="SET NULL"), nullable=True, index=True)
    estimated_minutes = Column(Integer, nullable=True)
    actual_minutes = Column(Integer, nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    project = relationship("Project", back_populates="tasks")
    goal = relationship("Goal")
    recurrence = relationship("TaskRecurrence", back_populates="task", uselist=False, cascade="all, delete-orphan")
    tags = relationship("Tag", secondary="task_tags")
