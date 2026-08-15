"""Activity log model for audit trails and productivity analytics."""

from sqlalchemy import JSON, Column, ForeignKey, String, Uuid

from app.models.base import BaseModel


class Activity(BaseModel):
    """Activity event stream record."""

    __tablename__ = "activities"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Uuid(as_uuid=True), nullable=True)
    description = Column(String(500), nullable=True)
    activity_metadata = Column("metadata", JSON, nullable=True)
