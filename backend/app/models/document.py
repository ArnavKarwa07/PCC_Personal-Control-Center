"""Document model for file metadata, attachments, and expirations."""

from sqlalchemy import Column, Date, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Document(BaseModel):
    """Document entity tracking stored files and attachments."""

    __tablename__ = "documents"

    name = Column(String(500), nullable=False)
    category = Column(String(100), nullable=True)
    file_path = Column(String(1000), nullable=True)
    mime_type = Column(String(100), nullable=True)
    size_bytes = Column(Integer, nullable=True)
    expiry_date = Column(Date, nullable=True)
    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="SET NULL"), nullable=True)

    project = relationship("Project")
