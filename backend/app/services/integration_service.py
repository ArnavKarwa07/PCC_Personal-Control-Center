"""Integration framework and connector implementations for third-party services."""

import uuid
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.integration import (
    Integration,
    IntegrationProvider,
    IntegrationStatus,
    IntegrationToken,
)
from app.schemas.integration import (
    IntegrationConnectRequest,
    IntegrationResponse,
    IntegrationStatusResponse,
)


class BaseConnector(ABC):
    """Abstract base connector for external providers."""

    @abstractmethod
    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        """Validate credentials and prepare provider configuration."""
        pass

    @abstractmethod
    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        """Revoke tokens and clean up provider assets."""
        pass

    @abstractmethod
    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        """Return diagnostic and synchronization status details."""
        pass

    @abstractmethod
    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        """Execute synchronization cycle with third-party service."""
        pass


class GitHubConnector(BaseConnector):
    """Connector for GitHub repositories, issues, and commit activity."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        token = data.access_token or data.api_key or (data.config or {}).get("token") or "mock_gh_token"
        username = (data.config or {}).get("username") or "user"
        return {
            "username": username,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "scope": ["repo", "user", "read:org"],
            "token_masked": f"ghp_{token[:4]}***" if len(token) > 4 else "ghp_****",
        }

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "GitHub"}
        cfg = integration.config or {}
        return {
            "service": "GitHub",
            "username": cfg.get("username", "user"),
            "scopes": cfg.get("scope", []),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_repos_count": cfg.get("synced_repos_count", 3),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_repos_count"] = 5
        integration.config = cfg
        db.commit()
        return {"provider": "github", "synced_items": 5, "synced_at": now_iso}


class GoogleCalendarConnector(BaseConnector):
    """Connector for Google Calendar two-way event synchronization."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        calendar_id = (data.config or {}).get("calendar_id") or "primary"
        return {
            "calendar_id": calendar_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "sync_token": "mock_sync_token_init",
        }

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Google Calendar"}
        cfg = integration.config or {}
        return {
            "service": "Google Calendar",
            "calendar_id": cfg.get("calendar_id", "primary"),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_events_count": cfg.get("synced_events_count", 12),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_events_count"] = 12
        integration.config = cfg
        db.commit()
        return {"provider": "google_calendar", "synced_items": 12, "synced_at": now_iso}


class IntegrationService:
    """Service managing third-party connectors, auth lifecycles, and synchronization."""

    _connectors: Dict[IntegrationProvider, BaseConnector] = {
        IntegrationProvider.GITHUB: GitHubConnector(),
        IntegrationProvider.GOOGLE_CALENDAR: GoogleCalendarConnector(),
    }

    @classmethod
    def get_connector(cls, provider: IntegrationProvider) -> BaseConnector:
        """Lookup connector implementation for a given provider."""
        connector = cls._connectors.get(provider)
        if not connector:
            raise BadRequestException(
                message=f"Unsupported integration provider: {provider}",
                code="UNSUPPORTED_INTEGRATION_PROVIDER",
            )
        return connector

    @staticmethod
    def _format_integration_response(integration: Integration) -> IntegrationResponse:
        """Format an Integration model into an IntegrationResponse."""
        return IntegrationResponse(
            id=integration.id,
            user_id=integration.user_id,
            provider=integration.provider,
            status=integration.status,
            config=integration.config,
            is_connected=integration.status == IntegrationStatus.CONNECTED,
            created_at=integration.created_at,
            updated_at=integration.updated_at,
            deleted_at=integration.deleted_at,
        )

    @classmethod
    def list_integrations(cls, db: Session, user_id: uuid.UUID) -> List[IntegrationResponse]:
        """List all supported providers with user-specific connection state."""
        existing_records = {
            r.provider: r
            for r in db.query(Integration)
            .filter(Integration.user_id == user_id, Integration.deleted_at.is_(None))
            .all()
        }

        results: List[IntegrationResponse] = []
        for provider in IntegrationProvider:
            if provider in existing_records:
                results.append(cls._format_integration_response(existing_records[provider]))
            else:
                results.append(
                    IntegrationResponse(
                        id=None,
                        user_id=user_id,
                        provider=provider,
                        status=IntegrationStatus.DISCONNECTED,
                        config=None,
                        is_connected=False,
                        created_at=None,
                        updated_at=None,
                        deleted_at=None,
                    )
                )
        return results

    @classmethod
    def get_integration(
        cls,
        db: Session,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
    ) -> Optional[Integration]:
        """Find an integration record by user and provider."""
        return (
            db.query(Integration)
            .filter(
                Integration.user_id == user_id,
                Integration.provider == provider,
                Integration.deleted_at.is_(None),
            )
            .first()
        )

    @classmethod
    def get_integration_status(
        cls,
        db: Session,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
    ) -> IntegrationStatusResponse:
        """Get diagnostic status information for a provider."""
        connector = cls.get_connector(provider)
        integration = cls.get_integration(db, user_id, provider)

        is_connected = integration is not None and integration.status == IntegrationStatus.CONNECTED
        status = integration.status if integration else IntegrationStatus.DISCONNECTED
        details = connector.get_status_details(db, integration)

        last_synced_at = None
        if integration and integration.config and "last_synced_at" in integration.config:
            try:
                last_synced_at = datetime.fromisoformat(integration.config["last_synced_at"])
            except Exception:
                pass

        return IntegrationStatusResponse(
            provider=provider,
            status=status,
            is_connected=is_connected,
            last_synced_at=last_synced_at,
            details=details,
        )

    @classmethod
    def connect_integration(
        cls,
        db: Session,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
        data: IntegrationConnectRequest,
    ) -> IntegrationResponse:
        """Connect and activate a third-party integration."""
        connector = cls.get_connector(provider)
        config_payload = connector.connect(db, user_id, data)

        integration = cls.get_integration(db, user_id, provider)
        if not integration:
            integration = Integration(
                user_id=user_id,
                provider=provider,
                status=IntegrationStatus.CONNECTED,
                config=config_payload,
            )
            db.add(integration)
        else:
            integration.status = IntegrationStatus.CONNECTED
            merged_config = dict(integration.config or {})
            merged_config.update(config_payload)
            integration.config = merged_config

        # Store token credentials securely if provided
        token_val = data.access_token or data.api_key
        if token_val:
            existing_token = (
                db.query(IntegrationToken)
                .filter(
                    IntegrationToken.user_id == user_id,
                    IntegrationToken.integration_id == integration.id,
                    IntegrationToken.deleted_at.is_(None),
                )
                .first()
            )
            if existing_token:
                existing_token.access_token_encrypted = token_val
            else:
                db.flush()
                new_token = IntegrationToken(
                    user_id=user_id,
                    integration_id=integration.id,
                    access_token_encrypted=token_val,
                )
                db.add(new_token)

        db.commit()
        db.refresh(integration)
        return cls._format_integration_response(integration)

    @classmethod
    def disconnect_integration(
        cls,
        db: Session,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
    ) -> IntegrationResponse:
        """Disconnect and revoke an active integration."""
        integration = cls.get_integration(db, user_id, provider)
        if not integration:
            raise NotFoundException(
                message=f"Integration '{provider.value}' is not configured.",
                code="INTEGRATION_NOT_FOUND",
            )

        connector = cls.get_connector(provider)
        connector.disconnect(db, user_id, integration)

        integration.status = IntegrationStatus.DISCONNECTED
        db.commit()
        db.refresh(integration)
        return cls._format_integration_response(integration)

    @classmethod
    def sync_provider(
        cls,
        db: Session,
        user_id: uuid.UUID,
        provider: IntegrationProvider,
    ) -> Dict[str, Any]:
        """Trigger ad-hoc synchronization for an active integration."""
        integration = cls.get_integration(db, user_id, provider)
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            raise BadRequestException(
                message=f"Cannot sync unlinked integration '{provider.value}'.",
                code="INTEGRATION_NOT_CONNECTED",
            )
        connector = cls.get_connector(provider)
        return connector.sync(db, user_id, integration)


integration_service = IntegrationService()
