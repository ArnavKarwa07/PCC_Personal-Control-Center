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

