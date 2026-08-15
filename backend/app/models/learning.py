"""LearningItem model for tracking courses, books, videos, and skill development."""

import enum

from sqlalchemy import Column, Enum, Float, ForeignKey, String, Text, Uuid

from app.models.base import BaseModel


class LearningResourceType(str, enum.Enum):
    COURSE = "course"
    BOOK = "book"
    VIDEO = "video"
    TUTORIAL = "tutorial"
    CERTIFICATION = "certification"
    TECHNOLOGY = "technology"


class LearningStatus(str, enum.Enum):
    SAVED = "saved"
    PLANNED = "planned"
    LEARNING = "learning"
    PRACTICING = "practicing"
    COMPLETED = "completed"


class LearningItem(BaseModel):
    """Learning syllabus, reading list, or curriculum item."""

    __tablename__ = "learning_items"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    resource_type = Column(
        Enum(LearningResourceType, name="learning_resource_type", values_callable=lambda obj: [e.value for e in obj]),
        default=LearningResourceType.COURSE,
        nullable=False,
    )
    url = Column(String(1000), nullable=True)
    status = Column(
        Enum(LearningStatus, name="learning_status", values_callable=lambda obj: [e.value for e in obj]),
        default=LearningStatus.SAVED,
        nullable=False,
    )
    progress = Column(Float, default=0.0, nullable=False)
    notes = Column(Text, nullable=True)
