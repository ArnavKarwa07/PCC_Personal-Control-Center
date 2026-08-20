"""Tests for Integrations and Weather APIs."""


# ==========================================
# 1. INTEGRATIONS TESTS
# ==========================================


def test_list_integrations_returns_all_providers(client, auth_headers):
    """Test GET /api/v1/integrations/list_integrations enumerates all supported providers."""
    res = client.get("/api/v1/integrations/list_integrations", headers=auth_headers)
    assert res.status_code == 200
    providers = res.json()["data"]
    provider_names = {p["provider"] for p in providers}
    assert "github" in provider_names
    assert "google_calendar" in provider_names
    assert "weather" in provider_names
    assert all(not p["is_connected"] for p in providers)


def test_connect_and_status_github_integration(client, auth_headers):
    """Test connecting GitHub provider and querying status."""
    connect_payload = {
        "access_token": "ghp_test_secret_token_12345",
        "config": {"username": "developer_test", "synced_repos_count": 4},
    }
    connect_res = client.post(
        "/api/v1/integrations/connect_integration/github",
        json=connect_payload,
        headers=auth_headers,
    )
    assert connect_res.status_code == 200
    data = connect_res.json()["data"]
    assert data["provider"] == "github"
    assert data["status"] == "connected"
    assert data["is_connected"] is True

    # Check status endpoint
    status_res = client.get("/api/v1/integrations/get_integration_status/github", headers=auth_headers)
    assert status_res.status_code == 200
    status_data = status_res.json()["data"]
    assert status_data["is_connected"] is True
    assert status_data["details"]["service"] == "GitHub"
    assert status_data["details"]["username"] == "developer_test"


def test_connect_google_calendar_and_disconnect(client, auth_headers):
    """Test connecting and disconnecting Google Calendar integration."""
    # 1. Connect
    res = client.post(
        "/api/v1/integrations/connect_integration/google_calendar",
        json={"config": {"calendar_id": "work_primary@gmail.com"}},
        headers=auth_headers,
    )
    assert res.status_code == 200
    assert res.json()["data"]["is_connected"] is True

    # 2. Disconnect
    disc_res = client.post(
        "/api/v1/integrations/disconnect_integration/google_calendar",
        headers=auth_headers,
    )
    assert disc_res.status_code == 200
    assert disc_res.json()["data"]["status"] == "disconnected"
    assert disc_res.json()["data"]["is_connected"] is False

    # Status should reflect disconnected
    st_res = client.get("/api/v1/integrations/get_integration_status/google_calendar", headers=auth_headers)
    assert st_res.json()["data"]["is_connected"] is False


def test_integration_multi_tenant_isolation(client, auth_headers, second_auth_headers):
    """Test that integration connections are isolated between users."""
    client.post(
        "/api/v1/integrations/connect_integration/github",
        json={"config": {"username": "user_one_gh"}},
        headers=auth_headers,
    )

    # Second user's GitHub integration should still be disconnected
    res_other = client.get("/api/v1/integrations/get_integration_status/github", headers=second_auth_headers)
    assert res_other.status_code == 200
    assert res_other.json()["data"]["is_connected"] is False


# ==========================================
# 2. WEATHER TESTS
# ==========================================


def test_get_current_weather(client, auth_headers):
    """Test GET /api/v1/weather/get_current_weather returns valid weather data with default location Pune, India."""
    res = client.get("/api/v1/weather/get_current_weather", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert "temperature" in data
    assert "condition" in data
    assert "humidity" in data
    assert "wind_speed" in data
    assert data["location"] == "Pune, India"
    assert data["temperature_unit"] in ["celsius", "fahrenheit"]


def test_get_weather_forecast_with_params(client, auth_headers):
    """Test GET /api/v1/weather/get_weather_forecast with query parameters."""
    res = client.get(
        "/api/v1/weather/get_weather_forecast?lat=37.7749&lon=-122.4194&city=San+Francisco&days=5&units=imperial",
        headers=auth_headers,
    )
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["location"] == "San Francisco"
    assert "current" in data
    assert "forecast" in data
    assert len(data["forecast"]) == 5
    first_day = data["forecast"][0]
    assert "date" in first_day
    assert "temp_min" in first_day
    assert "temp_max" in first_day
    assert "condition" in first_day
