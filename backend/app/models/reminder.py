"""Reminder model for scheduled notifications and alerts."""

import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text, Uuid

from app.models.base import BaseModel


class ReminderStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    SNOOZED = "snoozed"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Reminder(BaseModel):
    """Reminder entity scheduled for notification delivery."""

    __tablename__ = "reminders"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    remind_at = Column(DateTime(timezone=True), nullable=False, index=True)
    is_recurring = Column(Boolean, default=False, nullable=False)
    status = Column(
        Enum(ReminderStatus, name="reminder_status", values_callable=lambda obj: [e.value for e in obj]),
        default=ReminderStatus.PENDING,
        nullable=False,
    )
    snoozed_until = Column(DateTime(timezone=True), nullable=True)
