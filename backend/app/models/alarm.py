"""Alarm model for time-based wake/trigger events."""

from sqlalchemy import Boolean, Column, String, Time

from app.models.base import BaseModel


class Alarm(BaseModel):
    """Alarm entity for recurring or one-time audible/visual alerts."""

    __tablename__ = "alarms"

    label = Column(String(255), nullable=True)
    time = Column(Time, nullable=False)
    days_of_week = Column(String(50), nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=False)
    is_enabled = Column(Boolean, default=True, nullable=False)
