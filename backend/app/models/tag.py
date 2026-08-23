"""Tag model for categorizing tasks, projects, notes, and other entities."""

from sqlalchemy import Column, ForeignKey, String, UniqueConstraint, Uuid

from app.models.base import BaseModel


class Tag(BaseModel):
    """Tag entity."""

    __tablename__ = "tags"

    name = Column(String(100), nullable=False)
    color = Column(String(20), nullable=True)

    __table_args__ = (
        UniqueConstraint("name", name="uq_tag_name"),
    )
