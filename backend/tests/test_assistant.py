"""Tests for AI Executive Assistant endpoints."""

from fastapi.testclient import TestClient


def test_assistant_query_and_briefing(client: TestClient, auth_headers: dict):
    # Daily briefing
    res = client.get("/api/v1/ai/assistant/briefing", headers=auth_headers)
    assert res.status_code == 200
    briefing = res.json()
    assert "greeting" in briefing
    assert "executive_summary" in briefing

    # Dispatch task creation query
    res = client.post(
        "/api/v1/ai/assistant/query",
        headers=auth_headers,
        json={"query": "remind me to review Q3 financial projections"},
    )
    assert res.status_code == 200
    resp = res.json()
    assert resp["intent_detected"] == "CREATE_TASK"
    assert resp["executed_action"] is not None

    # Dispatch general info query
    res = client.post(
        "/api/v1/ai/assistant/query",
        headers=auth_headers,
        json={"query": "give me a status update on my productivity"},
    )
    assert res.status_code == 200
    resp = res.json()
    assert resp["intent_detected"] == "GENERAL_QUERY"
