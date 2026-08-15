"""Review and ReviewEntry models for weekly/periodic retrospectives."""

import enum

from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Text, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ReviewStatus(str, enum.Enum):
    DRAFT = "draft"
    COMPLETED = "completed"


class ReviewSection(str, enum.Enum):
    ACCOMPLISHMENTS = "accomplishments"
    OUTSTANDING = "outstanding"
    REFLECTION = "reflection"
    NEXT_WEEK = "next_week"


class Review(BaseModel):
    """Weekly or periodic review session container."""

    __tablename__ = "reviews"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    week_start = Column(Date, nullable=False)
    week_end = Column(Date, nullable=False)
    status = Column(
        Enum(ReviewStatus, name="review_status", values_callable=lambda obj: [e.value for e in obj]),
        default=ReviewStatus.DRAFT,
        nullable=False,
    )
    completed_at = Column(DateTime(timezone=True), nullable=True)

    entries = relationship("ReviewEntry", back_populates="review", cascade="all, delete-orphan", order_by="ReviewEntry.sort_order")


class ReviewEntry(BaseModel):
    """Specific section entry in a periodic review."""

    __tablename__ = "review_entries"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    review_id = Column(Uuid(as_uuid=True), ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False, index=True)
    section = Column(
        Enum(ReviewSection, name="review_section", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    content = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0, nullable=False)

    review = relationship("Review", back_populates="entries")
