"""Pydantic schemas for third-party Integrations."""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.models.integration import IntegrationProvider, IntegrationStatus


class IntegrationConnectRequest(BaseModel):
    """Payload for connecting a third-party service provider."""

    provider: Optional[IntegrationProvider] = Field(None, description="Target integration provider")
    auth_code: Optional[str] = Field(None, description="OAuth authorization code")
    api_key: Optional[str] = Field(None, description="API Key or Personal Access Token")
    access_token: Optional[str] = Field(None, description="Direct OAuth Access Token")
    config: Optional[Dict[str, Any]] = Field(None, description="Provider-specific configuration")


class IntegrationResponse(BaseModel):
    """Response model for an Integration provider status and config."""

    id: Optional[uuid.UUID] = None
    user_id: Optional[uuid.UUID] = None
    provider: IntegrationProvider
    status: IntegrationStatus
    config: Optional[Dict[str, Any]] = None
    is_connected: bool
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    deleted_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationStatusResponse(BaseModel):
    """Detailed status payload for a specific integration connector."""

    provider: IntegrationProvider
    status: IntegrationStatus
    is_connected: bool
    last_synced_at: Optional[datetime] = None
    details: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class IntegrationListResponse(BaseModel):
    """List response containing all supported integration providers and their statuses."""

    data: List[IntegrationResponse]
