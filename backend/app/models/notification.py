"""Notification model for cross-channel alerts and reminders."""

import enum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, String, Text, Uuid

from app.models.base import BaseModel


class NotificationType(str, enum.Enum):
    TASK_REMINDER = "task_reminder"
    UPCOMING_EVENT = "upcoming_event"
    DEADLINE = "deadline"
    RECURRING_TASK = "recurring_task"
    WEEKLY_REVIEW = "weekly_review"
    PROJECT_ALERT = "project_alert"
    INTEGRATION_UPDATE = "integration_update"
    SYSTEM = "system"


class NotificationChannel(str, enum.Enum):
    IN_APP = "in_app"
    WEB_PUSH = "web_push"
    EMAIL = "email"


class NotificationDeliveryStatus(str, enum.Enum):
    PENDING = "pending"
    SENT = "sent"
    READ = "read"
    FAILED = "failed"


class Notification(BaseModel):
    """Notification message dispatched across configured user channels."""

    __tablename__ = "notifications"

    title = Column(String(500), nullable=False)
    message = Column(Text, nullable=True)
    type = Column(
        Enum(NotificationType, name="notification_type", values_callable=lambda obj: [e.value for e in obj]),
        default=NotificationType.SYSTEM,
        nullable=False,
    )
    channel = Column(
        Enum(NotificationChannel, name="notification_channel", values_callable=lambda obj: [e.value for e in obj]),
        default=NotificationChannel.IN_APP,
        nullable=False,
    )
    status = Column(
        Enum(NotificationDeliveryStatus, name="notification_status", values_callable=lambda obj: [e.value for e in obj]),
        default=NotificationDeliveryStatus.PENDING,
        nullable=False,
    )
    entity_type = Column(String(50), nullable=True)
    entity_id = Column(Uuid(as_uuid=True), nullable=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
