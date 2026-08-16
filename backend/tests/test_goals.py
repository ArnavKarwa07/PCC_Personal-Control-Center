"""Tests for Goals & OKRs endpoints."""

from datetime import date

from fastapi.testclient import TestClient


def test_goals_crud_and_milestones(client: TestClient, auth_headers: dict):
    # Create goal with milestone
    res = client.post(
        "/api/v1/goals",
        headers=auth_headers,
        json={
            "name": "Master Distributed Systems Architecture",
            "description": "Build high-throughput event driven microservices",
            "time_period": "Q3 2026",
            "status": "in_progress",
            "progress": 35.0,
            "milestones": [
                {
                    "name": "Complete Raft consensus consensus implementation",
                    "target_date": date.today().isoformat(),
                }
            ],
        },
    )
    assert res.status_code == 201
    goal_id = res.json()["data"]["id"]
    assert len(res.json()["data"]["milestones"]) == 1

    # List goals
    res = client.get("/api/v1/goals", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Update goal progress to 100
    res = client.patch(
        f"/api/v1/goals/{goal_id}",
        headers=auth_headers,
        json={"progress": 100.0},
    )
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "completed"

    # Delete goal
    res = client.delete(f"/api/v1/goals/{goal_id}", headers=auth_headers)
    assert res.status_code == 204
