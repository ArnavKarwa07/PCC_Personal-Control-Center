"""Timer model for countdown, stopwatch, and pomodoro sessions."""

import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Uuid

from app.models.base import BaseModel


class TimerType(str, enum.Enum):
    COUNTDOWN = "countdown"
    STOPWATCH = "stopwatch"
    POMODORO = "pomodoro"


class TimerState(str, enum.Enum):
    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    COMPLETED = "completed"


class TimerModel(BaseModel):
    """Timer state persistence for synchronized focus and countdown sessions."""

    __tablename__ = "timers"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(255), nullable=True)
    timer_type = Column(
        Enum(TimerType, name="timer_type", values_callable=lambda obj: [e.value for e in obj]),
        default=TimerType.COUNTDOWN,
        nullable=False,
    )
    duration_seconds = Column(Integer, nullable=True)
    remaining_seconds = Column(Integer, nullable=True)
    status = Column(
        Enum(TimerState, name="timer_status", values_callable=lambda obj: [e.value for e in obj]),
        default=TimerState.IDLE,
        nullable=False,
    )
    started_at = Column(DateTime(timezone=True), nullable=True)
    preset_name = Column(String(100), nullable=True)
