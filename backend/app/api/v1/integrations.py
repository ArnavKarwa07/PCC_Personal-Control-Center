"""Third-Party Integrations REST API endpoints."""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.integration import IntegrationProvider
from app.models.user import User
from app.schemas.integration import IntegrationConnectRequest
from app.services.integration_service import integration_service

router = APIRouter(prefix="/integrations", tags=["Integrations"])


@router.get("/list_integrations", operation_id="list_integrations", summary="List Integrations")
def list_integrations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all available third-party integration connectors with connection statuses."""
    integrations = integration_service.list_integrations(db=db, user_id=settings.DEFAULT_OWNER_ID)
    return {
        "data": [i.model_dump() for i in integrations],
    }


@router.post("/connect_integration/{provider}", operation_id="connect_integration", status_code=status.HTTP_200_OK, summary="Connect Integration")
def connect_integration(
    provider: IntegrationProvider,
    data: IntegrationConnectRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Connect and authenticate a third-party service provider."""
    integration = integration_service.connect_integration(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        provider=provider,
        data=data,
    )
    return {
        "data": integration.model_dump(),
    }


@router.post("/disconnect_integration/{provider}", operation_id="disconnect_integration", summary="Disconnect Integration")
def disconnect_integration(
    provider: IntegrationProvider,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Disconnect and revoke credentials for a third-party provider."""
    integration = integration_service.disconnect_integration(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        provider=provider,
    )
    return {
        "data": integration.model_dump(),
    }


@router.get("/get_integration_status/{provider}", operation_id="get_integration_status", summary="Get Integration Status")
def get_integration_status(
    provider: IntegrationProvider,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve detailed synchronization and diagnostic status for a provider."""
    status_info = integration_service.get_integration_status(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        provider=provider,
    )
    return {
        "data": status_info.model_dump(),
    }


@router.post("/sync_integration/{provider}", operation_id="sync_integration", summary="Sync Integration")
@router.post("/{provider}/sync", operation_id="sync_integration_alias", summary="Sync Integration Alias", include_in_schema=False)
def sync_integration(
    provider: IntegrationProvider,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger ad-hoc synchronization for an active integration provider."""
    result = integration_service.sync_provider(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        provider=provider,
    )
    return {
        "data": result,
    }

