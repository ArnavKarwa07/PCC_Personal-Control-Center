"""Automation and AutomationRun models for event-action workflows."""

import enum

from sqlalchemy import JSON, Boolean, Column, DateTime, Enum, ForeignKey, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class AutomationRunStatus(str, enum.Enum):
    SUCCESS = "success"
    FAILURE = "failure"


class Automation(BaseModel):
    """Event-condition-action workflow automation definition."""

    __tablename__ = "automations"

    name = Column(String(255), nullable=False)
    trigger_type = Column(String(50), nullable=False)
    trigger_config = Column(JSON, nullable=True)
    conditions = Column(JSON, nullable=True)
    actions = Column(JSON, nullable=True)
    is_enabled = Column(Boolean, default=True, nullable=False)
    last_run = Column(DateTime(timezone=True), nullable=True)

    runs = relationship("AutomationRun", back_populates="automation", cascade="all, delete-orphan")


class AutomationRun(BaseModel):
    """Execution history entry for an automation."""

    __tablename__ = "automation_runs"

    automation_id = Column(
        Uuid(as_uuid=True), ForeignKey("automations.id", ondelete="CASCADE"), nullable=False, index=True
    )
    status = Column(
        Enum(AutomationRunStatus, name="automation_run_status", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    started_at = Column(DateTime(timezone=True), nullable=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)

    automation = relationship("Automation", back_populates="runs")
