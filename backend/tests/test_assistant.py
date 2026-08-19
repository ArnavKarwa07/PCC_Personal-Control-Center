"""Tests for AI Executive Assistant endpoints."""

from fastapi.testclient import TestClient


def test_assistant_query_and_briefing(client: TestClient, auth_headers: dict):
    # Daily briefing
    res = client.get("/api/v1/assistant/briefing", headers=auth_headers)
    assert res.status_code == 200
    briefing = res.json()
    assert "greeting" in briefing
    assert "executive_summary" in briefing
    assert "bullet_points" in briefing
    assert isinstance(briefing["bullet_points"], list)

    # Dispatch task creation query
    res = client.post(
        "/api/v1/assistant/query",
        headers=auth_headers,
        json={"query": "remind me to review Q3 roadmap projections"},
    )
    assert res.status_code == 200
    resp = res.json()
    assert resp["intent_detected"] == "CREATE_TASK"
    assert resp["executed_action"] is not None

    # Dispatch general info query
    res = client.post(
        "/api/v1/assistant/query",
        headers=auth_headers,
        json={"query": "give me a status update on my productivity"},
    )
    assert res.status_code == 200
    resp = res.json()
    assert resp["intent_detected"] == "GENERAL_QUERY"


def test_assistant_daily_briefing_deduplication(client: TestClient, auth_headers: dict):
    """Test that daily briefing bullet points are strictly deduplicated."""
    # Create duplicate tasks
    client.post("/api/v1/tasks", headers=auth_headers, json={"title": "Duplicate Task Item"})
    client.post("/api/v1/tasks", headers=auth_headers, json={"title": "Duplicate Task Item"})

    res = client.get("/api/v1/assistant/briefing", headers=auth_headers)
    assert res.status_code == 200
    briefing = res.json()

    bullet_points = briefing.get("bullet_points", [])
    normalized = [bp.strip().lower() for bp in bullet_points]
    assert len(normalized) == len(set(normalized)), "Daily briefing bullet points should be unique and deduplicated"
    # Ensure "Task: Duplicate Task Item" appears exactly once
    duplicate_count = sum(1 for bp in normalized if "duplicate task item" in bp)
    assert duplicate_count == 1


def test_assistant_negative_invalid_token(client: TestClient):
    """Test 401 error format for executive assistant endpoints with invalid auth token."""
    invalid_headers = {"Authorization": "Bearer invalidtoken123"}
    res_b = client.get("/api/v1/assistant/briefing", headers=invalid_headers)
    assert res_b.status_code == 401
    assert res_b.json()["error"]["code"] in ("UNAUTHORIZED", "INVALID_TOKEN")

    res_q = client.post("/api/v1/assistant/query", json={"query": "test"}, headers=invalid_headers)
    assert res_q.status_code == 401
    assert res_q.json()["error"]["code"] in ("UNAUTHORIZED", "INVALID_TOKEN")


def test_assistant_negative_missing_payload_fields(client: TestClient, auth_headers: dict):
    """Test 422 validation error format when assistant query payload lacks required fields."""
    res = client.post("/api/v1/assistant/query", json={}, headers=auth_headers)
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert "message" in err


def test_assistant_operation_ids_and_route_contracts(client: TestClient):
    """Test REST operation_id presence and route response contract for executive assistant."""
    openapi = client.app.openapi()
    endpoints = [
        ("/api/v1/assistant/briefing", "get"),
        ("/api/v1/assistant/query", "post"),
    ]
    for path, method in endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"


