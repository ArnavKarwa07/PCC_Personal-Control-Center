"""Tests for Notes, Ideas, and Idea Promotion to Projects/Tasks."""


def test_notes_crud_and_pin(client, auth_headers):
    """Test creating, reading, updating, pinning, and deleting notes."""
    # 1. Create notes
    res1 = client.post(
        "/api/v1/notes",
        json={"title": "Architecture Plan", "content": "FastAPI + React + Postgres", "category": "engineering", "is_pinned": False},
        headers=auth_headers,
    )
    assert res1.status_code == 201
    note1_id = res1.json()["data"]["id"]
    assert res1.json()["data"]["title"] == "Architecture Plan"
    assert res1.json()["data"]["category"] == "engineering"
    assert res1.json()["data"]["is_pinned"] is False

    res2 = client.post(
        "/api/v1/notes",
        json={"title": "Weekly Grocery", "content": "Milk, Eggs, Coffee", "category": "personal", "is_pinned": True},
        headers=auth_headers,
    )
    assert "id" in res2.json()["data"]

    # 2. List & filter notes
    list_res = client.get("/api/v1/notes?category=engineering", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1
    assert list_res.json()["data"][0]["title"] == "Architecture Plan"

    pinned_res = client.get("/api/v1/notes?is_pinned=true", headers=auth_headers)
    assert pinned_res.status_code == 200
    assert len(pinned_res.json()["data"]) == 1
    assert pinned_res.json()["data"][0]["title"] == "Weekly Grocery"

    # 3. Toggle pin
    pin_res = client.patch(f"/api/v1/notes/{note1_id}/pin", headers=auth_headers)
    assert pin_res.status_code == 200
    assert pin_res.json()["data"]["is_pinned"] is True

    # 4. Update note
    patch_res = client.patch(
        f"/api/v1/notes/{note1_id}",
        json={"content": "Updated Architecture Details"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["content"] == "Updated Architecture Details"

    # 5. Delete note
    del_res = client.delete(f"/api/v1/notes/{note1_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # 6. Verify 404
    assert client.get(f"/api/v1/notes/{note1_id}", headers=auth_headers).status_code == 404


def test_ideas_crud_and_filtering(client, auth_headers):
    """Test idea creation, listing, updating, and soft deletion."""
    # Create idea
    create_res = client.post(
        "/api/v1/ideas",
        json={"title": "AI Agent Assistant", "description": "Autonomous developer workflow", "category": "tech"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    idea_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["status"] == "captured"

    # List
    list_res = client.get("/api/v1/ideas?status=captured", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # Update
    update_res = client.patch(
        f"/api/v1/ideas/{idea_id}",
        json={"status": "exploring"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["status"] == "exploring"

    # Delete
    del_res = client.delete(f"/api/v1/ideas/{idea_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/ideas/{idea_id}", headers=auth_headers).status_code == 404


def test_promote_idea_to_project(client, auth_headers):
    """Test promoting an idea into a Project automatically."""
    create_res = client.post(
        "/api/v1/ideas",
        json={"title": "Build SaaS Product", "description": "Subscription micro-service platform"},
        headers=auth_headers,
    )
    idea_id = create_res.json()["data"]["id"]

    # Promote to project
    promote_res = client.post(
        f"/api/v1/ideas/{idea_id}/promote",
        json={"promote_to": "project", "priority": "high", "deadline": "2026-12-31"},
        headers=auth_headers,
    )
    assert promote_res.status_code == 200
    res_data = promote_res.json()["data"]

    # Verify idea was updated
    idea_data = res_data["idea"]
    assert idea_data["status"] == "promoted"
    assert idea_data["promoted_to_type"] == "project"
    project_id = idea_data["promoted_to_id"]
    assert project_id is not None

    # Verify project exists and is fetchable
    proj_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert proj_res.status_code == 200
    assert proj_res.json()["data"]["name"] == "Build SaaS Product"
    assert proj_res.json()["data"]["priority"] == "high"


def test_promote_idea_to_task(client, auth_headers):
    """Test promoting an idea into a Task automatically."""
    create_res = client.post(
        "/api/v1/ideas",
        json={"title": "Refactor Database Indexes", "description": "Add composite index on user_id + status"},
        headers=auth_headers,
    )
    idea_id = create_res.json()["data"]["id"]

    # Promote to task
    promote_res = client.post(
        f"/api/v1/ideas/{idea_id}/promote",
        json={"promote_to": "task", "priority": "urgent", "due_date": "2026-08-25"},
        headers=auth_headers,
    )
    assert promote_res.status_code == 200
    res_data = promote_res.json()["data"]

    # Verify idea state
    idea_data = res_data["idea"]
    assert idea_data["status"] == "promoted"
    assert idea_data["promoted_to_type"] == "task"
    task_id = idea_data["promoted_to_id"]
    assert task_id is not None

    # Verify task exists and is fetchable
    task_res = client.get(f"/api/v1/tasks/{task_id}", headers=auth_headers)
    assert task_res.status_code == 200
    assert task_res.json()["data"]["title"] == "Refactor Database Indexes"
    assert task_res.json()["data"]["priority"] == "urgent"
    assert task_res.json()["data"]["due_date"] == "2026-08-25"


def test_notes_ideas_multi_user_isolation(client, auth_headers, second_auth_headers):
    """Test multi-user isolation for notes and ideas."""
    # User A creates note and idea
    note_res = client.post("/api/v1/notes", json={"title": "Private Note"}, headers=auth_headers)
    idea_res = client.post("/api/v1/ideas", json={"title": "Private Idea"}, headers=auth_headers)
    note_id = note_res.json()["data"]["id"]
    idea_id = idea_res.json()["data"]["id"]

    # User B attempts access
    assert client.get(f"/api/v1/notes/{note_id}", headers=second_auth_headers).status_code == 404
    assert client.patch(f"/api/v1/notes/{note_id}", json={"title": "Hack"}, headers=second_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/notes/{note_id}", headers=second_auth_headers).status_code == 404

    assert client.get(f"/api/v1/ideas/{idea_id}", headers=second_auth_headers).status_code == 404
    assert client.patch(f"/api/v1/ideas/{idea_id}", json={"title": "Hack"}, headers=second_auth_headers).status_code == 404
    assert client.post(f"/api/v1/ideas/{idea_id}/promote", json={"promote_to": "task"}, headers=second_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/ideas/{idea_id}", headers=second_auth_headers).status_code == 404
