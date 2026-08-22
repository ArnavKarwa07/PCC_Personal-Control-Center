"""Tests for authentication and user profile APIs in single-tenant mode."""


def test_get_me_authenticated(client, auth_headers, test_user):
    """Test GET /users/get_users_me returns owner user profile."""
    response = client.get("/api/v1/users/get_users_me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_update_me(client, auth_headers):
    """Test PATCH /users/update_users_me updates user settings."""
    payload = {
        "full_name": "Arnav Karwa",
        "theme": "light",
        "timezone": "Asia/Kolkata",
    }
    response = client.patch("/api/v1/users/update_users_me", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Arnav Karwa"
    assert data["theme"] == "light"
    assert data["timezone"] == "Asia/Kolkata"


def test_logout(client):
    """Test POST /auth/logout_user returns success message."""
    response = client.post("/api/v1/auth/logout_user")
    assert response.status_code == 200
    assert "message" in response.json()["data"]


def test_auth_operation_ids_and_route_contracts(client):
    """Test REST operation_id presence in OpenAPI schema."""
    openapi = client.app.openapi()
    auth_endpoints = [
        ("/api/v1/auth/logout_user", "post"),
        ("/api/v1/users/get_users_me", "get"),
        ("/api/v1/users/update_users_me", "patch"),
    ]
    for path, method in auth_endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing in OpenAPI schema"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"
