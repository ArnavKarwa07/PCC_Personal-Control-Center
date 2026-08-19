"""Tests for authentication and user management APIs."""


def test_register_user(client):
    """Test user registration returns 201 and access token."""
    payload = {
        "email": "newuser@example.com",
        "password": "SecurePassword123!",
        "full_name": "New User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()["data"]
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"


def test_register_duplicate_email(client, test_user):
    """Test registering an existing email returns 409 conflict."""
    payload = {
        "email": test_user.email,
        "password": "Password123!",
        "full_name": "Duplicate User",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 409
    error = response.json()["error"]
    assert error["code"] == "EMAIL_ALREADY_EXISTS"


def test_register_short_password(client):
    """Test registering with short password returns 422 validation error."""
    payload = {
        "email": "shortpwd@example.com",
        "password": "short",
        "full_name": "Short Pwd",
    }
    response = client.post("/api/v1/auth/register", json=payload)
    assert response.status_code == 422
    assert "error" in response.json()


def test_login_user(client, test_user):
    """Test user login returns access token."""
    payload = {
        "email": "test@example.com",
        "password": "password123",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 200
    data = response.json()["data"]
    assert "access_token" in data
    assert data["user"]["email"] == test_user.email


def test_login_invalid_password(client, test_user):
    """Test login with wrong password returns 401."""
    payload = {
        "email": "test@example.com",
        "password": "wrongpassword",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "INVALID_CREDENTIALS"


def test_login_nonexistent_user(client):
    """Test login with unknown email returns 401."""
    payload = {
        "email": "nonexistent@example.com",
        "password": "somepassword",
    }
    response = client.post("/api/v1/auth/login", json=payload)
    assert response.status_code == 401


def test_get_me_authenticated(client, auth_headers, test_user):
    """Test GET /users/me returns current user profile."""
    response = client.get("/api/v1/users/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["email"] == test_user.email
    assert data["full_name"] == test_user.full_name


def test_get_me_unauthenticated(client):
    """Test GET /users/me without authorization returns 401."""
    response = client.get("/api/v1/users/me")
    assert response.status_code == 401
    error = response.json()["error"]
    assert error["code"] == "UNAUTHORIZED"


def test_update_me(client, auth_headers):
    """Test PATCH /users/me updates user settings."""
    payload = {
        "full_name": "Updated Name",
        "theme": "light",
        "timezone": "America/New_York",
    }
    response = client.patch("/api/v1/users/me", json=payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["full_name"] == "Updated Name"
    assert data["theme"] == "light"
    assert data["timezone"] == "America/New_York"


def test_logout(client):
    """Test POST /auth/logout returns success message."""
    response = client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    assert "message" in response.json()["data"]


def test_auth_negative_invalid_token(client):
    """Test 401 error format on invalid authorization token."""
    response = client.get("/api/v1/users/me", headers={"Authorization": "Bearer invalid.jwt.token"})
    assert response.status_code == 401
    res_json = response.json()
    assert "error" in res_json
    assert res_json["error"]["code"] == "UNAUTHORIZED"
    assert "message" in res_json["error"]


def test_auth_negative_missing_payload_fields(client):
    """Test 422 validation error format when missing required payload fields."""
    # Missing password in register
    res_reg = client.post("/api/v1/auth/register", json={"email": "incomplete@example.com"})
    assert res_reg.status_code == 422
    err_reg = res_reg.json()["error"]
    assert err_reg["code"] == "VALIDATION_ERROR"
    assert "message" in err_reg

    # Missing email in login
    res_login = client.post("/api/v1/auth/login", json={"password": "somepassword"})
    assert res_login.status_code == 422
    err_login = res_login.json()["error"]
    assert err_login["code"] == "VALIDATION_ERROR"
    assert "message" in err_login


def test_auth_operation_ids_and_route_contracts(client):
    """Test REST operation_id presence and route response contract in OpenAPI schema."""
    openapi = client.app.openapi()
    auth_endpoints = [
        ("/api/v1/auth/register", "post"),
        ("/api/v1/auth/login", "post"),
        ("/api/v1/auth/logout", "post"),
        ("/api/v1/users/me", "get"),
        ("/api/v1/users/me", "patch"),
    ]
    for path, method in auth_endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing in OpenAPI schema"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"

