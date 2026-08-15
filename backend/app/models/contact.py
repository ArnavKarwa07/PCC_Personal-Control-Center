"""Contact model for CRM and networking directory."""

from sqlalchemy import Column, Date, ForeignKey, String, Text, Uuid

from app.models.base import BaseModel


class Contact(BaseModel):
    """Contact entity stored per user."""

    __tablename__ = "contacts"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    organization = Column(String(255), nullable=True)
    role = Column(String(255), nullable=True)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    linkedin = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    last_interaction = Column(Date, nullable=True)
    next_followup = Column(Date, nullable=True)
