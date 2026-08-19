"""Third-Party Integrations REST API endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.integration import IntegrationProvider
from app.models.user import User
from app.schemas.integration import IntegrationConnectRequest
from app.services.integration_service import integration_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("", operation_id="listIntegrations")
def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all available third-party integration connectors with connection statuses."""
    integrations = integration_service.list_integrations(db=db, user_id=current_user.id)
    return {
        "data": [i.model_dump() for i in integrations],
    }


@router.post("/{provider}/connect", operation_id="connectIntegration", status_code=status.HTTP_200_OK)
def connect_integration(
    provider: IntegrationProvider,
    data: IntegrationConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Connect and authenticate a third-party service provider."""
    integration = integration_service.connect_integration(
        db=db,
        user_id=current_user.id,
        provider=provider,
        data=data,
    )
    return {
        "data": integration.model_dump(),
    }


@router.post("/{provider}/disconnect", operation_id="disconnectIntegration")
def disconnect_integration(
    provider: IntegrationProvider,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect and revoke credentials for a third-party provider."""
    integration = integration_service.disconnect_integration(
        db=db,
        user_id=current_user.id,
        provider=provider,
    )
    return {
        "data": integration.model_dump(),
    }


@router.get("/{provider}/status", operation_id="getIntegrationStatus")
def get_integration_status(
    provider: IntegrationProvider,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve detailed synchronization and diagnostic status for a provider."""
    status_info = integration_service.get_integration_status(
        db=db,
        user_id=current_user.id,
        provider=provider,
    )
    return {
        "data": status_info.model_dump(),
    }
