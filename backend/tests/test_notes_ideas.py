"""Tests for Notes, Ideas, and Idea Promotion in single-tenant mode."""

import uuid


def test_notes_crud_and_pin(client, auth_headers):
    """Test creating, reading, updating, pinning, and deleting notes."""
    # 1. Create notes
    res1 = client.post(
        "/api/v1/notes/create_note",
        json={
            "title": "Architecture Plan",
            "content": "FastAPI + React + Postgres",
            "category": "engineering",
            "is_pinned": False,
        },
        headers=auth_headers,
    )
    assert res1.status_code == 201
    note1_id = res1.json()["data"]["id"]
    assert res1.json()["data"]["title"] == "Architecture Plan"
    assert res1.json()["data"]["category"] == "engineering"
    assert res1.json()["data"]["is_pinned"] is False

    res2 = client.post(
        "/api/v1/notes/create_note",
        json={"title": "Weekly Grocery", "content": "Milk, Eggs, Coffee", "category": "personal", "is_pinned": True},
        headers=auth_headers,
    )
    assert "id" in res2.json()["data"]

    # 2. List & filter notes
    list_res = client.get("/api/v1/notes/list_notes?category=engineering", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1
    assert list_res.json()["data"][0]["title"] == "Architecture Plan"

    pinned_res = client.get("/api/v1/notes/list_notes?is_pinned=true", headers=auth_headers)
    assert pinned_res.status_code == 200
    assert len(pinned_res.json()["data"]) == 1
    assert pinned_res.json()["data"][0]["title"] == "Weekly Grocery"

    # 3. Toggle pin
    pin_res = client.post(f"/api/v1/notes/toggle_note_pin/{note1_id}", headers=auth_headers)
    assert pin_res.status_code == 200
    assert pin_res.json()["data"]["is_pinned"] is True

    # 4. Update note
    patch_res = client.patch(
        f"/api/v1/notes/update_note_by_id/{note1_id}",
        json={"content": "Updated Architecture Details"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["content"] == "Updated Architecture Details"

    # 5. Delete note
    del_res = client.delete(f"/api/v1/notes/delete_note_by_id/{note1_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # 6. Verify 404
    assert client.get(f"/api/v1/notes/get_note_by_id/{note1_id}", headers=auth_headers).status_code == 404


def test_ideas_crud_and_filtering(client, auth_headers):
    """Test idea creation, listing, updating, and soft deletion."""
    # Create idea
    create_res = client.post(
        "/api/v1/ideas/create_idea",
        json={"title": "AI Agent Assistant", "description": "Autonomous developer workflow", "category": "tech"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    idea_id = create_res.json()["data"]["id"]
    assert create_res.json()["data"]["status"] == "captured"

    # List
    list_res = client.get("/api/v1/ideas/list_ideas?status=captured", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1

    # Update
    update_res = client.patch(
        f"/api/v1/ideas/update_idea_by_id/{idea_id}",
        json={"status": "exploring"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["status"] == "exploring"

    # Delete
    del_res = client.delete(f"/api/v1/ideas/delete_idea_by_id/{idea_id}", headers=auth_headers)
    assert del_res.status_code == 200
    assert client.get(f"/api/v1/ideas/get_idea_by_id/{idea_id}", headers=auth_headers).status_code == 404


def test_promote_idea_to_project(client, auth_headers):
    """Test promoting an idea into a Project automatically."""
    create_res = client.post(
        "/api/v1/ideas/create_idea",
        json={"title": "Build SaaS Product", "description": "Subscription micro-service platform"},
        headers=auth_headers,
    )
    idea_id = create_res.json()["data"]["id"]

    # Promote to project
    promote_res = client.post(
        f"/api/v1/ideas/promote_idea_by_id/{idea_id}",
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
    proj_res = client.get(f"/api/v1/projects/get_project_by_id/{project_id}", headers=auth_headers)
    assert proj_res.status_code == 200
    assert proj_res.json()["data"]["name"] == "Build SaaS Product"
    assert proj_res.json()["data"]["priority"] == "high"


def test_promote_idea_to_task(client, auth_headers):
    """Test promoting an idea into a Task automatically."""
    create_res = client.post(
        "/api/v1/ideas/create_idea",
        json={"title": "Refactor Database Indexes", "description": "Add composite index on user_id + status"},
        headers=auth_headers,
    )
    idea_id = create_res.json()["data"]["id"]

    # Promote to task
    promote_res = client.post(
        f"/api/v1/ideas/promote_idea_by_id/{idea_id}",
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
    task_res = client.get(f"/api/v1/tasks/get_task_by_id/{task_id}", headers=auth_headers)
    assert task_res.status_code == 200
    assert task_res.json()["data"]["title"] == "Refactor Database Indexes"
    assert task_res.json()["data"]["priority"] == "urgent"
    assert task_res.json()["data"]["due_date"] == "2026-08-25"


def test_promote_idea_to_task_with_target_project_id(client, auth_headers):
    """Test promoting an idea to a task with target_project_id preserving project linkage."""
    # Create project first
    p_res = client.post("/api/v1/projects/create_project", json={"name": "Target Project"}, headers=auth_headers)
    assert p_res.status_code == 201
    project_id = p_res.json()["data"]["id"]

    # Create idea
    create_res = client.post(
        "/api/v1/ideas/create_idea",
        json={"title": "Project Task Idea", "description": "Needs to be linked to project"},
        headers=auth_headers,
    )
    idea_id = create_res.json()["data"]["id"]

    # Promote to task with target_project_id
    promote_res = client.post(
        f"/api/v1/ideas/promote_idea_by_id/{idea_id}",
        json={"promote_to": "task", "target_project_id": project_id},
        headers=auth_headers,
    )
    assert promote_res.status_code == 200
    task_id = promote_res.json()["data"]["idea"]["promoted_to_id"]

    # Verify created task has project_id populated
    task_res = client.get(f"/api/v1/tasks/get_task_by_id/{task_id}", headers=auth_headers)
    assert task_res.status_code == 200
    assert task_res.json()["data"]["project_id"] == project_id



def test_notes_ideas_negative_missing_payload_fields(client, auth_headers):
    """Test 422 validation error format when creating notes/ideas with invalid field types."""
    res_note = client.post("/api/v1/notes/create_note", json={"is_pinned": ["invalid", "list"]}, headers=auth_headers)
    assert res_note.status_code == 422
    err_note = res_note.json()["error"]
    assert err_note["code"] == "VALIDATION_ERROR"
    assert "message" in err_note

    res_idea = client.post("/api/v1/ideas/create_idea", json={"description": "No title"}, headers=auth_headers)
    assert res_idea.status_code == 422
    err_idea = res_idea.json()["error"]
    assert err_idea["code"] == "VALIDATION_ERROR"
    assert "message" in err_idea

    res_promo = client.post(f"/api/v1/ideas/promote_idea_by_id/{uuid.uuid4()}", json={}, headers=auth_headers)
    assert res_promo.status_code == 422
    assert res_promo.json()["error"]["code"] == "VALIDATION_ERROR"


def test_notes_ideas_negative_nonexistent_resource_lookup(client, auth_headers):
    """Test 404 output format for non-existent note or idea ID operations."""
    fake_id = str(uuid.uuid4())

    res_n_get = client.get(f"/api/v1/notes/get_note_by_id/{fake_id}", headers=auth_headers)
    assert res_n_get.status_code == 404
    assert res_n_get.json()["error"]["code"] in ("NOTE_NOT_FOUND", "NOT_FOUND")

    res_n_patch = client.patch(
        f"/api/v1/notes/update_note_by_id/{fake_id}", json={"title": "Updated"}, headers=auth_headers
    )
    assert res_n_patch.status_code == 404

    res_n_del = client.delete(f"/api/v1/notes/delete_note_by_id/{fake_id}", headers=auth_headers)
    assert res_n_del.status_code == 404

    res_i_get = client.get(f"/api/v1/ideas/get_idea_by_id/{fake_id}", headers=auth_headers)
    assert res_i_get.status_code == 404
    assert res_i_get.json()["error"]["code"] in ("IDEA_NOT_FOUND", "NOT_FOUND")

    res_i_promote = client.post(
        f"/api/v1/ideas/promote_idea_by_id/{fake_id}", json={"promote_to": "task"}, headers=auth_headers
    )
    assert res_i_promote.status_code == 404

    res_i_del = client.delete(f"/api/v1/ideas/delete_idea_by_id/{fake_id}", headers=auth_headers)
    assert res_i_del.status_code == 404


def test_notes_ideas_operation_ids_and_route_contracts(client):
    """Test REST operation_id presence and route response contract for notes and ideas."""
    openapi = client.app.openapi()
    endpoints = [
        ("/api/v1/notes/list_notes", "get"),
        ("/api/v1/notes/create_note", "post"),
        ("/api/v1/notes/get_note_by_id/{note_id}", "get"),
        ("/api/v1/notes/update_note_by_id/{note_id}", "patch"),
        ("/api/v1/notes/delete_note_by_id/{note_id}", "delete"),
        ("/api/v1/ideas/list_ideas", "get"),
        ("/api/v1/ideas/create_idea", "post"),
        ("/api/v1/ideas/get_idea_by_id/{idea_id}", "get"),
        ("/api/v1/ideas/update_idea_by_id/{idea_id}", "patch"),
        ("/api/v1/ideas/delete_idea_by_id/{idea_id}", "delete"),
        ("/api/v1/ideas/promote_idea_by_id/{idea_id}", "post"),
    ]
    for path, method in endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"
