"""Tests for Goals & OKRs endpoints in single-tenant mode."""

import uuid
from datetime import date

from fastapi.testclient import TestClient


def test_goals_crud_and_milestones(client: TestClient, auth_headers: dict):
    # Create goal with milestone
    res = client.post(
        "/api/v1/goals/create_goal",
        headers=auth_headers,
        json={
            "name": "Master Distributed Systems Architecture",
            "description": "Build high-throughput event driven microservices",
            "time_period": "Q3 2026",
            "status": "in_progress",
            "progress": 35.0,
            "milestones": [
                {
                    "name": "Complete Raft consensus implementation",
                    "target_date": date.today().isoformat(),
                }
            ],
        },
    )
    assert res.status_code == 201
    goal_id = res.json()["data"]["id"]
    assert len(res.json()["data"]["milestones"]) == 1

    # List goals
    res = client.get("/api/v1/goals/list_goals", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update goal progress to 100
    res = client.patch(
        f"/api/v1/goals/update_goal_by_id/{goal_id}",
        headers=auth_headers,
        json={"progress": 100.0},
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "completed"

    # Delete goal
    res = client.delete(f"/api/v1/goals/delete_goal_by_id/{goal_id}", headers=auth_headers)
    assert res.status_code == 204


def test_goals_negative_missing_payload_fields(client: TestClient, auth_headers: dict):
    """Test 422 validation error format when goal payload lacks required fields."""
    res = client.post("/api/v1/goals/create_goal", json={"time_period": "2026-Q3"}, headers=auth_headers)
    assert res.status_code == 422
    err = res.json()["error"]
    assert err["code"] == "VALIDATION_ERROR"
    assert "message" in err


def test_goals_negative_nonexistent_resource_lookup(client: TestClient, auth_headers: dict):
    """Test 404 output format for non-existent goal ID operations."""
    fake_id = str(uuid.uuid4())
    res_patch = client.patch(f"/api/v1/goals/update_goal_by_id/{fake_id}", json={"progress": 50.0}, headers=auth_headers)
    assert res_patch.status_code == 404
    assert res_patch.json()["error"]["code"] in ("GOAL_NOT_FOUND", "NOT_FOUND")

    res_del = client.delete(f"/api/v1/goals/delete_goal_by_id/{fake_id}", headers=auth_headers)
    assert res_del.status_code == 404
    assert res_del.json()["error"]["code"] in ("GOAL_NOT_FOUND", "NOT_FOUND")


def test_goals_operation_ids_and_route_contracts(client: TestClient):
    """Test REST operation_id presence and route response contracts for goal routes."""
    openapi = client.app.openapi()
    goal_endpoints = [
        ("/api/v1/goals/list_goals", "get"),
        ("/api/v1/goals/create_goal", "post"),
        ("/api/v1/goals/update_goal_by_id/{goal_id}", "patch"),
        ("/api/v1/goals/delete_goal_by_id/{goal_id}", "delete"),
    ]
    for path, method in goal_endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"
