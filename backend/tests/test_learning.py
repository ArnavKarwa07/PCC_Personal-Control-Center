"""Tests for Learning Center REST API endpoints."""

import uuid

from fastapi.testclient import TestClient


def test_learning_crud_and_stats(client: TestClient, auth_headers: dict):
    # 1. Create a course item
    res = client.post(
        "/api/v1/learning",
        headers=auth_headers,
        json={
            "title": "Distributed Systems with Go & Raft",
            "resource_type": "course",
            "url": "https://distributed.example.com",
            "status": "learning",
            "progress": 35.0,
            "notes": "Studying leader election and log replication",
        },
    )
    assert res.status_code == 201
    course = res.json()["data"]
    course_id = course["id"]
    assert course["title"] == "Distributed Systems with Go & Raft"
    assert course["resource_type"] == "course"
    assert course["progress"] == 35.0
    assert course["status"] == "learning"

    # 2. Create a book item
    res_book = client.post(
        "/api/v1/learning",
        headers=auth_headers,
        json={
            "title": "Designing Data-Intensive Applications",
            "resource_type": "book",
            "url": "https://dataintensive.example.com",
            "status": "saved",
            "progress": 0.0,
            "notes": "Essential reading for scalable data architectures",
        },
    )
    assert res_book.status_code == 201
    book_id = res_book.json()["data"]["id"]

    # 3. Create a certification item
    res_cert = client.post(
        "/api/v1/learning",
        headers=auth_headers,
        json={
            "title": "AWS Certified Solutions Architect",
            "resource_type": "certification",
            "status": "completed",
            "progress": 100.0,
            "notes": "Passed with 920 score",
        },
    )
    assert res_cert.status_code == 201

    # 4. List all learning items
    res_list = client.get("/api/v1/learning", headers=auth_headers)
    assert res_list.status_code == 200
    data = res_list.json()["data"]
    meta = res_list.json()["meta"]
    assert len(data) >= 3
    assert meta["total"] >= 3

    # 5. Filter by resource_type
    res_filtered = client.get("/api/v1/learning?resource_type=book", headers=auth_headers)
    assert res_filtered.status_code == 200
    assert len(res_filtered.json()["data"]) == 1
    assert res_filtered.json()["data"][0]["title"] == "Designing Data-Intensive Applications"

    # 6. Filter by status
    res_status = client.get("/api/v1/learning?status=completed", headers=auth_headers)
    assert res_status.status_code == 200
    assert any(i["title"] == "AWS Certified Solutions Architect" for i in res_status.json()["data"])

    # 7. Search filter
    res_search = client.get("/api/v1/learning?search=Raft", headers=auth_headers)
    assert res_search.status_code == 200
    assert len(res_search.json()["data"]) == 1
    assert res_search.json()["data"][0]["id"] == course_id

    # 8. Get learning stats
    res_stats = client.get("/api/v1/learning/stats", headers=auth_headers)
    assert res_stats.status_code == 200
    stats = res_stats.json()
    assert stats["total"] >= 3
    assert stats["completed"] >= 1
    assert stats["in_progress"] >= 1
    assert stats["saved"] >= 1
    assert "course" in stats["by_type"]
    assert "book" in stats["by_type"]

    # 9. Get item by ID
    res_single = client.get(f"/api/v1/learning/{course_id}", headers=auth_headers)
    assert res_single.status_code == 200
    assert res_single.json()["data"]["id"] == course_id

    # 10. Update item (progress to 100% -> auto completed)
    res_update = client.patch(
        f"/api/v1/learning/{course_id}",
        headers=auth_headers,
        json={"progress": 100.0, "notes": "Completed all modules and lab exercises"},
    )
    assert res_update.status_code == 200
    updated = res_update.json()["data"]
    assert updated["progress"] == 100.0
    assert updated["status"] == "completed"
    assert updated["notes"] == "Completed all modules and lab exercises"

    # 11. Delete item
    res_del = client.delete(f"/api/v1/learning/{book_id}", headers=auth_headers)
    assert res_del.status_code == 204

    # 12. 404 on deleted or non-existent
    res_not_found = client.get(f"/api/v1/learning/{book_id}", headers=auth_headers)
    assert res_not_found.status_code == 404

    res_fake = client.get(f"/api/v1/learning/{uuid.uuid4()}", headers=auth_headers)
    assert res_fake.status_code == 404
