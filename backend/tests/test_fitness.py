"""Tests for Health & Fitness telemetry endpoints."""

from datetime import date
from fastapi.testclient import TestClient


def test_fitness_summary_and_workout_crud(client: TestClient, auth_headers: dict):
    # Initial summary
    res = client.get("/api/v1/fitness/summary", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total_workouts"] == 0

    # Create workout with exercise
    res = client.post(
        "/api/v1/fitness/workouts",
        headers=auth_headers,
        json={
            "date": date.today().isoformat(),
            "name": "Morning Strength Session",
            "notes": "Focused on upper body hyper-trophy",
            "duration_minutes": 45,
            "exercises": [
                {
                    "name": "Bench Press",
                    "sets": 4,
                    "reps": 10,
                    "weight": 85.5,
                    "exercise_type": "strength",
                }
            ],
        },
    )
    assert res.status_code == 201
    workout_id = res.json()["data"]["id"]
    assert len(res.json()["data"]["exercises"]) == 1

    # List workouts
    res = client.get("/api/v1/fitness/workouts", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] == 1

    # Summary updated
    res = client.get("/api/v1/fitness/summary", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["total_workouts"] == 1
    assert res.json()["total_duration_minutes"] == 45

    # Delete workout
    res = client.delete(f"/api/v1/fitness/workouts/{workout_id}", headers=auth_headers)
    assert res.status_code == 204
