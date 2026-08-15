"""Tag model for categorizing tasks, projects, notes, and other entities."""

from sqlalchemy import Column, ForeignKey, String, UniqueConstraint, Uuid

from app.models.base import BaseModel


class Tag(BaseModel):
    """Tag entity associated with a user."""

    __tablename__ = "tags"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=True)

    __table_args__ = (
        UniqueConstraint("user_id", "name", name="uq_user_tag_name"),
    )
