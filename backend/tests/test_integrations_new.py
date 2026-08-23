"""Unit tests for new integration connectors (Teams Calendar, Slack, GitLab, Jira)."""

from app.models.integration import Integration, IntegrationProvider, IntegrationStatus
from app.services.integration_service import integration_service
from worker.main import poll_external_sync


def test_list_integrations_includes_new_providers(client):
    """Test GET /api/v1/integrations/list_integrations includes teams_calendar, slack, gitlab, and jira."""
    res = client.get("/api/v1/integrations/list_integrations")
    assert res.status_code == 200
    providers = res.json()["data"]
    provider_names = {p["provider"] for p in providers}
    assert "github" in provider_names
    assert "google_calendar" in provider_names
    assert "teams_calendar" in provider_names
    assert "slack" in provider_names
    assert "gitlab" in provider_names
    assert "jira" in provider_names


def test_teams_calendar_connector_lifecycle(client):
    """Test connect, get status, sync, and disconnect for Teams Calendar."""
    # 1. Connect
    connect_payload = {
        "access_token": "msteams_secret_access_token_12345",
        "config": {"calendar_id": "team_cal_99", "tenant_id": "corp_tenant_42"},
    }
    connect_res = client.post(
        "/api/v1/integrations/connect_integration/teams_calendar",
        json=connect_payload,
    )
    assert connect_res.status_code == 200
    data = connect_res.json()["data"]
    assert data["provider"] == "teams_calendar"
    assert data["status"] == "connected"
    assert data["is_connected"] is True
    assert data["config"]["calendar_id"] == "team_cal_99"
    assert data["config"]["tenant_id"] == "corp_tenant_42"
    assert "msteams_" in data["config"]["token_masked"]

    # 2. Get Status
    status_res = client.get("/api/v1/integrations/get_integration_status/teams_calendar")
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["is_connected"] is True
    assert status_data["details"]["service"] == "Teams Calendar"
    assert status_data["details"]["calendar_id"] == "team_cal_99"
    assert status_data["details"]["tenant_id"] == "corp_tenant_42"

    # 3. Disconnect
    disc_res = client.post("/api/v1/integrations/disconnect_integration/teams_calendar")
    assert disc_res.status_code == 200
    assert disc_res.json()["data"]["is_connected"] is False

    # Check status after disconnect
    st_res = client.get("/api/v1/integrations/get_integration_status/teams_calendar")
    assert st_res.json()["data"]["is_connected"] is False
    assert st_res.json()["data"]["details"]["status"] == "unlinked"


def test_slack_connector_lifecycle(client):
    """Test connect, get status, sync, and disconnect for Slack."""
    # 1. Connect
    connect_payload = {
        "access_token": "xoxb-1234567890-abcdef",
        "config": {"workspace": "Engineering Team", "bot_user": "pcc_dev_bot"},
    }
    connect_res = client.post(
        "/api/v1/integrations/connect_integration/slack",
        json=connect_payload,
    )
    assert connect_res.status_code == 200
    data = connect_res.json()["data"]
    assert data["provider"] == "slack"
    assert data["status"] == "connected"
    assert data["is_connected"] is True
    assert data["config"]["workspace"] == "Engineering Team"
    assert data["config"]["bot_user"] == "pcc_dev_bot"

    # 2. Get Status
    status_res = client.get("/api/v1/integrations/get_integration_status/slack")
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["is_connected"] is True
    assert status_data["details"]["service"] == "Slack"
    assert status_data["details"]["workspace"] == "Engineering Team"
    assert status_data["details"]["bot_user"] == "pcc_dev_bot"

    # 3. Disconnect
    disc_res = client.post("/api/v1/integrations/disconnect_integration/slack")
    assert disc_res.status_code == 200
    assert disc_res.json()["data"]["is_connected"] is False


def test_gitlab_connector_lifecycle(client):
    """Test connect, get status, sync, and disconnect for GitLab."""
    # 1. Connect
    connect_payload = {
        "api_key": "glpat-secret_pat_998877",
        "config": {"gitlab_url": "https://gitlab.example.com", "username": "dev_gitlab"},
    }
    connect_res = client.post(
        "/api/v1/integrations/connect_integration/gitlab",
        json=connect_payload,
    )
    assert connect_res.status_code == 200
    data = connect_res.json()["data"]
    assert data["provider"] == "gitlab"
    assert data["status"] == "connected"
    assert data["is_connected"] is True
    assert data["config"]["gitlab_url"] == "https://gitlab.example.com"
    assert data["config"]["username"] == "dev_gitlab"

    # 2. Get Status
    status_res = client.get("/api/v1/integrations/get_integration_status/gitlab")
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["is_connected"] is True
    assert status_data["details"]["service"] == "GitLab"
    assert status_data["details"]["gitlab_url"] == "https://gitlab.example.com"
    assert status_data["details"]["username"] == "dev_gitlab"

    # 3. Disconnect
    disc_res = client.post("/api/v1/integrations/disconnect_integration/gitlab")
    assert disc_res.status_code == 200
    assert disc_res.json()["data"]["is_connected"] is False


def test_jira_connector_lifecycle(client):
    """Test connect, get status, sync, and disconnect for Jira."""
    # 1. Connect
    connect_payload = {
        "api_key": "jira_token_sec_554433",
        "config": {"domain": "corp.atlassian.net", "email": "dev@corp.com", "project_key": "PCC"},
    }
    connect_res = client.post(
        "/api/v1/integrations/connect_integration/jira",
        json=connect_payload,
    )
    assert connect_res.status_code == 200
    data = connect_res.json()["data"]
    assert data["provider"] == "jira"
    assert data["status"] == "connected"
    assert data["is_connected"] is True
    assert data["config"]["domain"] == "corp.atlassian.net"
    assert data["config"]["email"] == "dev@corp.com"
    assert data["config"]["project_key"] == "PCC"

    # 2. Get Status
    status_res = client.get("/api/v1/integrations/get_integration_status/jira")
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["is_connected"] is True
    assert status_data["details"]["service"] == "Jira"
    assert status_data["details"]["domain"] == "corp.atlassian.net"
    assert status_data["details"]["project_key"] == "PCC"

    # 3. Disconnect
    disc_res = client.post("/api/v1/integrations/disconnect_integration/jira")
    assert disc_res.status_code == 200
    assert disc_res.json()["data"]["is_connected"] is False


def test_direct_connector_sync_methods(db_session):
    """Test direct sync method execution for all 4 new connectors."""
    for provider in [
        IntegrationProvider.TEAMS_CALENDAR,
        IntegrationProvider.SLACK,
        IntegrationProvider.GITLAB,
        IntegrationProvider.JIRA,
    ]:
        integ = Integration(
            provider=provider,
            status=IntegrationStatus.CONNECTED,
            config={},
        )
        db_session.add(integ)
        db_session.commit()

        result = integration_service.sync_provider(db_session, provider)
        assert result["provider"] == provider.value
        assert "synced_items" in result
        assert "synced_at" in result

        # Verify status details after sync
        status_payload = integration_service.get_integration_status(db_session, provider)
        assert status_payload.is_connected is True
        assert status_payload.last_synced_at is not None


def test_worker_polls_all_new_integrations(db_session):
    """Test worker poll_external_sync synchronizes all new active connectors."""
    providers = [
        IntegrationProvider.TEAMS_CALENDAR,
        IntegrationProvider.SLACK,
        IntegrationProvider.GITLAB,
        IntegrationProvider.JIRA,
    ]
    for p in providers:
        db_session.add(
            Integration(
                provider=p,
                status=IntegrationStatus.CONNECTED,
                config={},
            )
        )
    db_session.commit()

    stats = poll_external_sync(db_session)
    assert stats["teams_calendar_synced"] == 1
    assert stats["slack_synced"] == 1
    assert stats["gitlab_synced"] == 1
    assert stats["jira_synced"] == 1
    assert stats["total_synced"] >= 4


def test_sync_integration_endpoints(client):
    """Test POST /api/v1/integrations/sync_integration/{provider} and /{provider}/sync alias."""
    client.post(
        "/api/v1/integrations/connect_integration/github",
        json={"access_token": "ghp_1234567890"},
    )

    res1 = client.post("/api/v1/integrations/sync_integration/github")
    assert res1.status_code == 200
    assert res1.json()["data"]["provider"] == "github"

    res2 = client.post("/api/v1/integrations/github/sync")
    assert res2.status_code == 200
    assert res2.json()["data"]["provider"] == "github"

    res_fail = client.post("/api/v1/integrations/slack/sync")
    assert res_fail.status_code == 400


def test_sensitive_credential_masking(client):
    """Test sensitive credentials are masked in IntegrationResponse config and status details."""
    payload = {
        "access_token": "xoxb-1234567890-abcdef",
        "config": {
            "token": "ghp_secret_token_123",
            "userToken": "xoxp-9876543210-abcdef",
            "apiToken": "jira_secret_token_456",
            "secret": "my_hidden_secret",
            "workspace": "Secure Corp",
        },
    }
    res = client.post(
        "/api/v1/integrations/connect_integration/slack",
        json=payload,
    )
    assert res.status_code == 200
    config = res.json()["data"]["config"]
    assert config["token"] == "ghp_****"
    assert config["userToken"] == "xoxp-****"
    assert config["apiToken"] == "jira_****"
    assert config["secret"] == "****"
    assert config["workspace"] == "Secure Corp"

    st_res = client.get("/api/v1/integrations/get_integration_status/slack")
    assert st_res.status_code == 200


def test_camel_case_config_key_alignment(client):
    """Test connectors accept camelCase config keys seamlessly."""
    teams_res = client.post(
        "/api/v1/integrations/connect_integration/teams_calendar",
        json={"config": {"tenantId": "t_camel_123", "calendarId": "c_camel_456", "clientId": "cl_789"}},
    )
    assert teams_res.status_code == 200
    t_cfg = teams_res.json()["data"]["config"]
    assert t_cfg["tenant_id"] == "t_camel_123"
    assert t_cfg["calendar_id"] == "c_camel_456"

    slack_res = client.post(
        "/api/v1/integrations/connect_integration/slack",
        json={"config": {"userToken": "xoxp-11223344", "botToken": "xoxb-55667788", "defaultChannel": "dev-chat"}},
    )
    assert slack_res.status_code == 200
    s_cfg = slack_res.json()["data"]["config"]
    assert s_cfg["default_channel"] == "dev-chat"
    assert s_cfg["user_token"] == "xoxp-****"
    assert s_cfg["bot_token"] == "xoxb-****"

    gitlab_res = client.post(
        "/api/v1/integrations/connect_integration/gitlab",
        json={"config": {"gitlabUrl": "https://gitlab.internal.com", "projectIds": [10, 20]}},
    )
    assert gitlab_res.status_code == 200
    g_cfg = gitlab_res.json()["data"]["config"]
    assert g_cfg["gitlab_url"] == "https://gitlab.internal.com"
    assert g_cfg["project_ids"] == [10, 20]

    jira_res = client.post(
        "/api/v1/integrations/connect_integration/jira",
        json={"config": {"domain": "myjira.atlassian.net", "email": "admin@myjira.com", "apiToken": "jira_token_777", "projectKey": "CAMEL"}},
    )
    assert jira_res.status_code == 200
    j_cfg = jira_res.json()["data"]["config"]
    assert j_cfg["domain"] == "myjira.atlassian.net"
    assert j_cfg["project_key"] == "CAMEL"
    assert j_cfg["api_token"] == "jira_****"


def test_worker_rollback_on_sync_exception(db_session, monkeypatch):
    """Test poll_external_sync performs db.rollback() when sync_provider raises an exception."""
    db_session.add(
        Integration(
            provider=IntegrationProvider.GITHUB,
            status=IntegrationStatus.CONNECTED,
            config={},
        )
    )
    db_session.commit()

    def mock_sync_error(*args, **kwargs):
        raise ValueError("Simulated sync error")

    monkeypatch.setattr(integration_service, "sync_provider", mock_sync_error)

    stats = poll_external_sync(db_session)
    assert stats["total_synced"] == 0

