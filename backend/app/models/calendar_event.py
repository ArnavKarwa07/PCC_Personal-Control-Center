"""Calendar event database model."""

import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, Text, Uuid

from app.models.base import BaseModel


class CalendarEventType(str, enum.Enum):
    EVENT = "event"
    MEETING = "meeting"
    TASK = "task"
    DEADLINE = "deadline"
    REMINDER = "reminder"
    APPOINTMENT = "appointment"
    PERSONAL = "personal"


class CalendarEvent(BaseModel):
    """Event representation for PCC calendar system with external synchronization support."""

    __tablename__ = "calendar_events"

    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(
        Enum(CalendarEventType, name="calendar_event_type", values_callable=lambda obj: [e.value for e in obj]),
        default=CalendarEventType.EVENT,
        nullable=False,
    )
    start_time = Column(DateTime(timezone=True), nullable=False, index=True)
    end_time = Column(DateTime(timezone=True), nullable=True)
    all_day = Column(Boolean, default=False, nullable=False)
    location = Column(String(500), nullable=True)
    source = Column(String(50), default="pcc", nullable=False)
    external_id = Column(String(255), nullable=True, index=True)
