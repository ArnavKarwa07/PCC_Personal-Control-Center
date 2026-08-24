"""Note model for markdown documents and knowledge capture."""

from sqlalchemy import Boolean, Column, String, Text

from app.models.base import BaseModel


class Note(BaseModel):
    """Note entity for personal documentation and ideas."""

    __tablename__ = "notes"

    title = Column(String(500), nullable=True)
    content = Column(Text, nullable=True)
    category = Column(String(100), nullable=True)
    is_pinned = Column(Boolean, default=False, nullable=False)
