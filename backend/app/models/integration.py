"""Integration and IntegrationToken models for third-party providers."""

import enum

from sqlalchemy import JSON, Column, DateTime, Enum, ForeignKey, String, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class IntegrationProvider(str, enum.Enum):
    GITHUB = "github"
    GOOGLE_CALENDAR = "google_calendar"
    TEAMS_CALENDAR = "teams_calendar"
    SLACK = "slack"
    GITLAB = "gitlab"
    JIRA = "jira"
    TELEGRAM = "telegram"
    NOTION = "notion"
    DISCORD = "discord"


class IntegrationStatus(str, enum.Enum):
    CONNECTED = "connected"
    DISCONNECTED = "disconnected"


class Integration(BaseModel):
    """External service integration descriptor."""

    __tablename__ = "integrations"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider = Column(
        Enum(IntegrationProvider, name="integration_provider", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    status = Column(
        Enum(IntegrationStatus, name="integration_status", values_callable=lambda obj: [e.value for e in obj]),
        default=IntegrationStatus.DISCONNECTED,
        nullable=False,
    )
    config = Column(JSON, nullable=True)

    tokens = relationship("IntegrationToken", back_populates="integration", cascade="all, delete-orphan")


class IntegrationToken(BaseModel):
    """Encrypted OAuth access and refresh credentials."""

    __tablename__ = "integration_tokens"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    integration_id = Column(Uuid(as_uuid=True), ForeignKey("integrations.id", ondelete="CASCADE"), nullable=False, index=True)
    access_token_encrypted = Column(String(1000), nullable=False)
    refresh_token_encrypted = Column(String(1000), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    integration = relationship("Integration", back_populates="tokens")
