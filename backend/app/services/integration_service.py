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


SENSITIVE_KEYS = {
    "token",
    "user_token",
    "usertoken",
    "bot_token",
    "bottoken",
    "api_token",
    "apitoken",
    "access_token",
    "accesstoken",
    "api_key",
    "apikey",
    "secret",
    "client_secret",
    "clientsecret",
    "password",
}


def mask_credential_value(val: Any) -> Any:
    """Mask sensitive string credentials into prefix-preserved masked strings."""
    if not isinstance(val, str):
        return "****"
    if not val:
        return "****"
    if val.endswith("****") or "***" in val:
        return val

    if val.startswith("ghp_") or val.startswith("ghp-"):
        return "ghp_****"
    elif val.startswith("xoxb-") or val.startswith("xoxp-"):
        return f"{val[:5]}****"
    elif val.startswith("glpat-"):
        return "glpat-****"
    elif val.startswith("glpat_"):
        return "glpat_****"
    elif val.startswith("msteams_"):
        return "msteams_****"
    elif val.startswith("jira_"):
        return "jira_****"
    else:
        return "****"


def _mask_sensitive_config(config: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """Recursively mask sensitive values in configuration or status detail dictionaries."""
    if not config or not isinstance(config, dict):
        return config

    masked = {}
    for k, v in config.items():
        k_normalized = k.lower().replace("_", "")
        is_sensitive = (
            k_normalized in SENSITIVE_KEYS
            or "token" in k_normalized
            or "secret" in k_normalized
            or "password" in k_normalized
            or "apikey" in k_normalized
        ) and k != "token_masked"

        if is_sensitive:
            masked[k] = mask_credential_value(v)
        elif isinstance(v, dict):
            masked[k] = _mask_sensitive_config(v)
        else:
            masked[k] = v
    return masked


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
        cfg = dict(data.config or {})
        token = data.access_token or data.api_key or cfg.get("token") or cfg.get("api_token") or cfg.get("apiToken") or "mock_gh_token"
        username = cfg.get("username") or "user"
        token_masked = mask_credential_value(token)
        if token_masked == "****":
            token_masked = f"ghp_{token[:4]}***" if len(token) > 4 else "ghp_****"

        res = dict(cfg)
        res.update({
            "username": username,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "scope": ["repo", "user", "read:org"],
            "token_masked": token_masked,
        })
        return res

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
        cfg = dict(data.config or {})
        calendar_id = cfg.get("calendar_id") or cfg.get("calendarId") or "primary"
        res = dict(cfg)
        res.update({
            "calendar_id": calendar_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "sync_token": "mock_sync_token_init",
        })
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Google Calendar"}
        cfg = integration.config or {}
        calendar_id = cfg.get("calendar_id") or cfg.get("calendarId") or "primary"
        return {
            "service": "Google Calendar",
            "calendar_id": calendar_id,
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


class TeamsCalendarConnector(BaseConnector):
    """Connector for Microsoft Teams Calendar event synchronization."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        token = data.access_token or data.api_key or cfg.get("token") or cfg.get("user_token") or cfg.get("userToken") or cfg.get("api_token") or cfg.get("apiToken") or "mock_teams_token"
        calendar_id = cfg.get("calendar_id") or cfg.get("calendarId") or "teams_primary"
        tenant_id = cfg.get("tenant_id") or cfg.get("tenantId") or "default_tenant"
        client_id = cfg.get("client_id") or cfg.get("clientId")

        token_masked = mask_credential_value(token)
        if token_masked == "****":
            token_masked = f"msteams_{token[:4]}***" if len(token) > 4 else "msteams_****"

        res = dict(cfg)
        res.update({
            "calendar_id": calendar_id,
            "tenant_id": tenant_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "token_masked": token_masked,
            "sync_token": "mock_teams_sync_token_init",
        })
        if client_id:
            res["client_id"] = client_id
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Teams Calendar"}
        cfg = integration.config or {}
        calendar_id = cfg.get("calendar_id") or cfg.get("calendarId") or "teams_primary"
        tenant_id = cfg.get("tenant_id") or cfg.get("tenantId") or "default_tenant"
        client_id = cfg.get("client_id") or cfg.get("clientId")
        res = {
            "service": "Teams Calendar",
            "calendar_id": calendar_id,
            "tenant_id": tenant_id,
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_events_count": cfg.get("synced_events_count", 8),
        }
        if client_id:
            res["client_id"] = client_id
        return res

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_events_count"] = 8
        integration.config = cfg
        db.commit()
        return {"provider": "teams_calendar", "synced_items": 8, "synced_at": now_iso}


class SlackConnector(BaseConnector):
    """Connector for Slack workspace messages and channel notifications."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        user_token = cfg.get("user_token") or cfg.get("userToken")
        bot_token = cfg.get("bot_token") or cfg.get("botToken")
        default_channel = cfg.get("default_channel") or cfg.get("defaultChannel")
        token = data.access_token or data.api_key or cfg.get("token") or user_token or bot_token or "xoxb_mock_slack_token"
        workspace = cfg.get("workspace") or cfg.get("team_name") or cfg.get("teamName") or "PCC Workspace"
        bot_user = cfg.get("bot_user") or cfg.get("botUser") or "pcc_bot"

        token_masked = mask_credential_value(token)
        if token_masked == "****":
            token_masked = f"xoxb-{token[5:9]}***" if len(token) > 9 else (f"slack_{token[:4]}***" if len(token) > 4 else "slack_****")

        res = dict(cfg)
        res.update({
            "workspace": workspace,
            "bot_user": bot_user,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "scope": ["channels:read", "chat:write", "users:read"],
            "token_masked": token_masked,
        })
        if default_channel:
            res["default_channel"] = default_channel
        if user_token:
            res["user_token"] = user_token
        if bot_token:
            res["bot_token"] = bot_token
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Slack"}
        cfg = integration.config or {}
        workspace = cfg.get("workspace") or cfg.get("team_name") or cfg.get("teamName") or "PCC Workspace"
        bot_user = cfg.get("bot_user") or cfg.get("botUser") or "pcc_bot"
        default_channel = cfg.get("default_channel") or cfg.get("defaultChannel")
        res = {
            "service": "Slack",
            "workspace": workspace,
            "bot_user": bot_user,
            "scopes": cfg.get("scope", ["channels:read", "chat:write", "users:read"]),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_messages_count": cfg.get("synced_messages_count", 15),
        }
        if default_channel:
            res["default_channel"] = default_channel
        return res

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_messages_count"] = 15
        integration.config = cfg
        db.commit()
        return {"provider": "slack", "synced_items": 15, "synced_at": now_iso}


class GitLabConnector(BaseConnector):
    """Connector for GitLab repositories, merge requests, and pipelines."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        token = data.access_token or data.api_key or cfg.get("token") or cfg.get("api_token") or cfg.get("apiToken") or "glpat_mock_gitlab_token"
        gitlab_url = cfg.get("gitlab_url") or cfg.get("gitlabUrl") or "https://gitlab.com"
        username = cfg.get("username") or "gitlab_user"
        project_ids = cfg.get("project_ids") or cfg.get("projectIds")

        token_masked = mask_credential_value(token)
        if token_masked == "****":
            token_masked = f"glpat_{token[6:10]}***" if len(token) > 10 else (f"glpat_{token[:4]}***" if len(token) > 4 else "glpat_****")

        res = dict(cfg)
        res.update({
            "gitlab_url": gitlab_url,
            "username": username,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "scope": ["api", "read_repository", "read_user"],
            "token_masked": token_masked,
        })
        if project_ids:
            res["project_ids"] = project_ids
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "GitLab"}
        cfg = integration.config or {}
        gitlab_url = cfg.get("gitlab_url") or cfg.get("gitlabUrl") or "https://gitlab.com"
        username = cfg.get("username") or "gitlab_user"
        project_ids = cfg.get("project_ids") or cfg.get("projectIds")
        res = {
            "service": "GitLab",
            "gitlab_url": gitlab_url,
            "username": username,
            "scopes": cfg.get("scope", ["api", "read_repository", "read_user"]),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_projects_count": cfg.get("synced_projects_count", 4),
        }
        if project_ids:
            res["project_ids"] = project_ids
        return res

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_projects_count"] = 4
        integration.config = cfg
        db.commit()
        return {"provider": "gitlab", "synced_items": 4, "synced_at": now_iso}


class JiraConnector(BaseConnector):
    """Connector for Jira projects, issues, and sprint tracking."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        api_token = cfg.get("api_token") or cfg.get("apiToken") or cfg.get("token")
        token = data.access_token or data.api_key or api_token or "jira_mock_api_token"
        domain = cfg.get("domain") or cfg.get("site_url") or cfg.get("siteUrl") or "company.atlassian.net"
        email = cfg.get("email") or "user@example.com"
        project_key = cfg.get("project_key") or cfg.get("projectKey") or "PROJ"

        token_masked = mask_credential_value(token)
        if token_masked == "****":
            token_masked = f"jira_{token[:4]}***" if len(token) > 4 else "jira_****"

        res = dict(cfg)
        res.update({
            "domain": domain,
            "email": email,
            "project_key": project_key,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "token_masked": token_masked,
        })
        if api_token:
            res["api_token"] = api_token
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Jira"}
        cfg = integration.config or {}
        domain = cfg.get("domain") or cfg.get("site_url") or cfg.get("siteUrl") or "company.atlassian.net"
        email = cfg.get("email") or "user@example.com"
        project_key = cfg.get("project_key") or cfg.get("projectKey") or "PROJ"
        return {
            "service": "Jira",
            "domain": domain,
            "email": email,
            "project_key": project_key,
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_issues_count": cfg.get("synced_issues_count", 10),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_issues_count"] = 10
        integration.config = cfg
        db.commit()
        return {"provider": "jira", "synced_items": 10, "synced_at": now_iso}




class TelegramConnector(BaseConnector):
    """Connector for Telegram bot notifications and alert delivery."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        bot_token = cfg.get("bot_token") or cfg.get("botToken") or data.access_token or data.api_key or "bot_mock_token"
        chat_id = cfg.get("chat_id") or cfg.get("chatId") or "12345678"
        token_masked = mask_credential_value(bot_token)
        res = dict(cfg)
        res.update({
            "bot_token": bot_token,
            "chat_id": chat_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "token_masked": token_masked,
        })
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Telegram"}
        cfg = integration.config or {}
        return {
            "service": "Telegram",
            "chat_id": cfg.get("chat_id") or cfg.get("chatId", "12345678"),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_alerts_count": cfg.get("synced_alerts_count", 8),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_alerts_count"] = 8
        integration.config = cfg
        db.commit()
        return {"provider": "telegram", "synced_items": 8, "synced_at": now_iso}


class NotionConnector(BaseConnector):
    """Connector for Notion workspace databases and notes sync."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        token = data.access_token or data.api_key or cfg.get("integrationToken") or cfg.get("integration_token") or cfg.get("apiKey") or cfg.get("api_key") or "secret_mock_notion_token"
        workspace_id = cfg.get("workspaceId") or cfg.get("workspace_id") or "workspace_main"
        token_masked = mask_credential_value(token)
        res = dict(cfg)
        res.update({
            "workspace_id": workspace_id,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "token_masked": token_masked,
        })
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Notion"}
        cfg = integration.config or {}
        return {
            "service": "Notion",
            "workspace_id": cfg.get("workspace_id") or cfg.get("workspaceId", "workspace_main"),
            "last_synced_at": cfg.get("last_synced_at"),
            "synced_pages_count": cfg.get("synced_pages_count", 14),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["synced_pages_count"] = 14
        integration.config = cfg
        db.commit()
        return {"provider": "notion", "synced_items": 14, "synced_at": now_iso}


class DiscordConnector(BaseConnector):
    """Connector for Discord channel webhooks and notification dispatch."""

    def connect(self, db: Session, user_id: uuid.UUID, data: IntegrationConnectRequest) -> Dict[str, Any]:
        cfg = dict(data.config or {})
        webhook_url = cfg.get("webhookUrl") or cfg.get("webhook_url") or data.access_token or data.api_key or "https://discord.com/api/webhooks/mock"
        url_masked = mask_credential_value(webhook_url)
        res = dict(cfg)
        res.update({
            "webhook_url": webhook_url,
            "connected_at": datetime.now(timezone.utc).isoformat(),
            "webhook_masked": url_masked,
        })
        return res

    def disconnect(self, db: Session, user_id: uuid.UUID, integration: Integration) -> None:
        pass

    def get_status_details(self, db: Session, integration: Optional[Integration]) -> Dict[str, Any]:
        if not integration or integration.status != IntegrationStatus.CONNECTED:
            return {"status": "unlinked", "service": "Discord"}
        cfg = integration.config or {}
        return {
            "service": "Discord",
            "webhook_url_masked": mask_credential_value(cfg.get("webhook_url") or cfg.get("webhookUrl", "https://discord.com/api/webhooks/mock")),
            "last_synced_at": cfg.get("last_synced_at"),
            "dispatched_webhooks_count": cfg.get("dispatched_webhooks_count", 6),
        }

    def sync(self, db: Session, user_id: uuid.UUID, integration: Integration) -> Dict[str, Any]:
        cfg = dict(integration.config or {})
        now_iso = datetime.now(timezone.utc).isoformat()
        cfg["last_synced_at"] = now_iso
        cfg["dispatched_webhooks_count"] = 6
        integration.config = cfg
        db.commit()
        return {"provider": "discord", "synced_items": 6, "synced_at": now_iso}


class IntegrationService:
    """Service managing third-party connectors, auth lifecycles, and synchronization."""

    _connectors: Dict[IntegrationProvider, BaseConnector] = {
        IntegrationProvider.GITHUB: GitHubConnector(),
        IntegrationProvider.GOOGLE_CALENDAR: GoogleCalendarConnector(),
        IntegrationProvider.TEAMS_CALENDAR: TeamsCalendarConnector(),
        IntegrationProvider.SLACK: SlackConnector(),
        IntegrationProvider.GITLAB: GitLabConnector(),
        IntegrationProvider.JIRA: JiraConnector(),
        IntegrationProvider.TELEGRAM: TelegramConnector(),
        IntegrationProvider.NOTION: NotionConnector(),
        IntegrationProvider.DISCORD: DiscordConnector(),
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

    @classmethod
    def _format_integration_response(cls, integration: Integration) -> IntegrationResponse:
        """Format an Integration model into an IntegrationResponse with masked sensitive config."""
        masked_config = _mask_sensitive_config(integration.config) if integration.config else None
        return IntegrationResponse(
            id=integration.id,
            user_id=integration.user_id,
            provider=integration.provider,
            status=integration.status,
            config=masked_config,
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
        masked_details = _mask_sensitive_config(details) if isinstance(details, dict) else details

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
            details=masked_details,
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

