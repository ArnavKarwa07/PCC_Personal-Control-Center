"""Idea model for concept incubator and promotion to tasks/projects."""

import enum

from sqlalchemy import Column, Enum, String, Text, Uuid

from app.models.base import BaseModel


class IdeaStatus(str, enum.Enum):
    CAPTURED = "captured"
    EXPLORING = "exploring"
    PROMOTED = "promoted"
    ARCHIVED = "archived"


class Idea(BaseModel):
    """Idea entity capable of promotion into projects or tasks."""

    __tablename__ = "ideas"

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    status = Column(
        Enum(IdeaStatus, name="idea_status", values_callable=lambda obj: [e.value for e in obj]),
        default=IdeaStatus.CAPTURED,
        nullable=False,
    )
    promoted_to_type = Column(String(50), nullable=True)
    promoted_to_id = Column(Uuid(as_uuid=True), nullable=True)
