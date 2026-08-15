"""Tests for Task CRUD operations, filtering, pagination, and multi-user isolation."""

import uuid


def test_create_task(client, auth_headers):
    """Test task creation with tags, priority, and due date."""
    payload = {
        "title": "Complete Backend Implementation",
        "description": "Implement all 40 models, auth, and tasks endpoints.",
        "status": "todo",
        "priority": "high",
        "due_date": "2026-08-20",
        "estimated_minutes": 120,
        "tags": ["backend", "fastapi", "core"],
    }
    response = client.post("/api/v1/tasks", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["title"] == payload["title"]
    assert data["status"] == "todo"
    assert data["priority"] == "high"
    assert data["due_date"] == "2026-08-20"
    assert data["estimated_minutes"] == 120
    assert set(data["tags"]) == {"backend", "fastapi", "core"}
    assert "id" in data
    assert "user_id" in data


def test_list_tasks(client, auth_headers):
    """Test listing tasks with pagination metadata."""
    # Create 3 tasks
    for i in range(3):
        client.post(
            "/api/v1/tasks",
            json={"title": f"Task {i+1}", "status": "inbox"},
            headers=auth_headers,
        )

    response = client.get("/api/v1/tasks?page=1&per_page=2", headers=auth_headers)
    assert response.status_code == 200
    res_json = response.json()
    assert len(res_json["data"]) == 2
    assert res_json["meta"]["total"] == 3
    assert res_json["meta"]["page"] == 1
    assert res_json["meta"]["per_page"] == 2
    assert res_json["meta"]["total_pages"] == 2


def test_list_tasks_filtering(client, auth_headers):
    """Test filtering tasks by status and priority."""
    client.post(
        "/api/v1/tasks",
        json={"title": "High Urgent Task", "status": "in_progress", "priority": "urgent"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/tasks",
        json={"title": "Low Inbox Task", "status": "inbox", "priority": "low"},
        headers=auth_headers,
    )

    # Filter by status
    response = client.get("/api/v1/tasks?status=in_progress", headers=auth_headers)
    assert response.status_code == 200
    tasks = response.json()["data"]
    assert len(tasks) == 1
    assert tasks[0]["title"] == "High Urgent Task"

    # Filter by priority
    response = client.get("/api/v1/tasks?priority=low", headers=auth_headers)
    assert response.status_code == 200
    tasks = response.json()["data"]
    assert len(tasks) == 1
    assert tasks[0]["title"] == "Low Inbox Task"


def test_get_task(client, auth_headers):
    """Test retrieving a single task by ID."""
    create_res = client.post(
        "/api/v1/tasks",
        json={"title": "Inspectable Task", "status": "inbox"},
        headers=auth_headers,
    )
    task_id = create_res.json()["data"]["id"]

    response = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["data"]["id"] == task_id
    assert response.json()["data"]["title"] == "Inspectable Task"


def test_update_task(client, auth_headers):
    """Test updating task details and status transition to DONE sets completed_at."""
    create_res = client.post(
        "/api/v1/tasks",
        json={"title": "Incomplete Task", "status": "inbox"},
        headers=auth_headers,
    )
    task_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["completed_at"] is None

    update_payload = {
        "title": "Completed Task",
        "status": "done",
        "actual_minutes": 45,
    }
    response = client.patch(f"/api/v1/tasks/{task_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    data = response.json()["data"]
    assert data["title"] == "Completed Task"
    assert data["status"] == "done"
    assert data["actual_minutes"] == 45
    assert data["completed_at"] is not None


def test_delete_task(client, auth_headers):
    """Test soft deleting a task removes it from subsequent queries."""
    create_res = client.post(
        "/api/v1/tasks",
        json={"title": "Task to Delete", "status": "inbox"},
        headers=auth_headers,
    )
    task_id = create_res.json()["data"]["id"]

    del_res = client.delete(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert "message" in del_res.json()["data"]

    # Verify task is no longer returned in get
    get_res = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert get_res.status_code == 404
    assert get_res.json()["error"]["code"] == "TASK_NOT_FOUND"

    # Verify task is not listed
    list_res = client.get("/api/v1/tasks", headers=auth_headers)
    assert len(list_res.json()["data"]) == 0


def test_task_ownership_isolation(client, auth_headers, second_auth_headers):
    """Test user A cannot read, update, or delete user B's task."""
    # User A creates a task
    create_res = client.post(
        "/api/v1/tasks",
        json={"title": "User A Private Task"},
        headers=auth_headers,
    )
    task_id = create_res.json()["data"]["id"]

    # User B attempts to access User A's task
    get_res = client.get(f"/api/v1/tasks/{task_id}", headers=second_auth_headers)
    assert get_res.status_code == 404
    assert get_res.json()["error"]["code"] == "TASK_NOT_FOUND"

    # User B attempts to update User A's task
    patch_res = client.patch(f"/api/v1/tasks/{task_id}", json={"title": "Hacked"}, headers=second_auth_headers)
    assert patch_res.status_code == 404

    # User B attempts to delete User A's task
    delete_res = client.delete(f"/api/v1/tasks/{task_id}", headers=second_auth_headers)
    assert delete_res.status_code == 404


def test_task_unauthenticated(client):
    """Test that task endpoints require valid authentication."""
    random_id = str(uuid.uuid4())
    assert client.get("/api/v1/tasks").status_code == 401
    assert client.post("/api/v1/tasks", json={"title": "Test"}).status_code == 401
    assert client.get(f"/api/v1/tasks/{random_id}").status_code == 401
    assert client.patch(f"/api/v1/tasks/{random_id}", json={"title": "Test"}).status_code == 401
    assert client.delete(f"/api/v1/tasks/{random_id}").status_code == 401
