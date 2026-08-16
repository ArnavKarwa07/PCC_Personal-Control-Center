"""Tests for Weekly & Monthly Reviews endpoints and service."""

from datetime import date, timedelta

from fastapi.testclient import TestClient


def test_reviews_full_lifecycle(client: TestClient, auth_headers: dict):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    week_end = week_start + timedelta(days=6)

    # 1. Create a review (default sections should be auto-created)
    res = client.post(
        "/api/v1/reviews",
        headers=auth_headers,
        json={
            "week_start": week_start.isoformat(),
            "week_end": week_end.isoformat(),
            "status": "draft",
        },
    )
    assert res.status_code == 201
    review_data = res.json()["data"]
    review_id = review_data["id"]
    assert review_data["status"] == "draft"
    assert review_data["week_start"] == week_start.isoformat()
    assert review_data["week_end"] == week_end.isoformat()
    assert len(review_data["entries"]) == 4

    # 2. Get current week review
    res = client.get("/api/v1/reviews/current", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["id"] == review_id

    # 3. Upsert reflection entries
    res = client.post(
        f"/api/v1/reviews/{review_id}/entries",
        headers=auth_headers,
        json={
            "section": "accomplishments",
            "content": "Shipped weekly review feature with glassmorphism UI.",
            "sort_order": 0,
        },
    )
    assert res.status_code == 200
    assert res.json()["data"]["content"] == "Shipped weekly review feature with glassmorphism UI."

    res = client.post(
        f"/api/v1/reviews/{review_id}/entries",
        headers=auth_headers,
        json={
            "section": "reflection",
            "content": "Need to manage async task polling better.",
            "sort_order": 2,
        },
    )
    assert res.status_code == 200
    assert res.json()["data"]["section"] == "reflection"

    # 4. Get review details by ID
    res = client.get(f"/api/v1/reviews/{review_id}", headers=auth_headers)
    assert res.status_code == 200
    entries = {e["section"]: e["content"] for e in res.json()["data"]["entries"]}
    assert entries["accomplishments"] == "Shipped weekly review feature with glassmorphism UI."
    assert entries["reflection"] == "Need to manage async task polling better."

    # 5. List reviews with filter
    res = client.get("/api/v1/reviews?status=draft", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["meta"]["total"] >= 1

    # 6. Complete review
    res = client.patch(f"/api/v1/reviews/{review_id}/complete", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["data"]["status"] == "completed"
    assert res.json()["data"]["completed_at"] is not None

    # 7. Check stats
    res = client.get("/api/v1/reviews/stats", headers=auth_headers)
    assert res.status_code == 200
    stats = res.json()["data"]
    assert stats["total_reviews"] >= 1
    assert stats["completed_reviews"] >= 1
    assert stats["streak_weeks"] >= 1

    # 8. Update review details
    res = client.patch(
        f"/api/v1/reviews/{review_id}",
        headers=auth_headers,
        json={
            "entries": [
                {
                    "section": "next_week",
                    "content": "Optimize build pipelines and increase test coverage.",
                    "sort_order": 3,
                }
            ]
        },
    )
    assert res.status_code == 200

    # 9. Delete review
    res = client.delete(f"/api/v1/reviews/{review_id}", headers=auth_headers)
    assert res.status_code == 204

    # 10. Verify 404 after deletion
    res = client.get(f"/api/v1/reviews/{review_id}", headers=auth_headers)
    assert res.status_code == 404
