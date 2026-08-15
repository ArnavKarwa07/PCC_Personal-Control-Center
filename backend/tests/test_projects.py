"""Tests for Projects, Project Members, and Kanban Boards."""

from app.models.contact import Contact


def test_create_project(client, auth_headers):
    """Test project creation creates default board and columns."""
    payload = {
        "name": "Phase B Implementation",
        "description": "Building all Phase B endpoints and services.",
        "status": "planned",
        "priority": "high",
        "start_date": "2026-08-16",
        "deadline": "2026-08-30",
        "tags": ["backend", "fastapi"],
    }
    response = client.post("/api/v1/projects", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["name"] == payload["name"]
    assert data["status"] == "planned"
    assert data["priority"] == "high"
    assert data["start_date"] == "2026-08-16"
    assert data["deadline"] == "2026-08-30"
    assert set(data["tags"]) == {"backend", "fastapi"}
    assert data["progress"] == 0.0
    assert "id" in data
    assert "user_id" in data


def test_list_and_filter_projects(client, auth_headers):
    """Test listing projects with status/priority filtering and pagination."""
    client.post(
        "/api/v1/projects",
        json={"name": "Active High Project", "status": "active", "priority": "high"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/projects",
        json={"name": "Paused Low Project", "status": "paused", "priority": "low"},
        headers=auth_headers,
    )

    # Filter status
    res = client.get("/api/v1/projects?status=active", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1
    assert res.json()["data"][0]["name"] == "Active High Project"

    # Search filter
    res = client.get("/api/v1/projects?search=Paused", headers=auth_headers)
    assert res.status_code == 200
    assert len(res.json()["data"]) == 1
    assert res.json()["data"][0]["name"] == "Paused Low Project"


def test_project_progress_calculation(client, auth_headers):
    """Test progress is calculated based on linked completed tasks."""
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Progress Test Project"},
        headers=auth_headers,
    )
    project_id = proj_res.json()["data"]["id"]

    # Add 2 tasks (1 todo, 1 done)
    client.post(
        "/api/v1/tasks",
        json={"title": "Task 1", "project_id": project_id, "status": "done"},
        headers=auth_headers,
    )
    client.post(
        "/api/v1/tasks",
        json={"title": "Task 2", "project_id": project_id, "status": "todo"},
        headers=auth_headers,
    )

    # Fetch project
    res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()["data"]
    assert data["task_count"] == 2
    assert data["completed_task_count"] == 1
    assert data["progress"] == 50.0


def test_update_and_delete_project(client, auth_headers):
    """Test updating project details and soft-deleting project."""
    create_res = client.post(
        "/api/v1/projects",
        json={"name": "Project to Update"},
        headers=auth_headers,
    )
    project_id = create_res.json()["data"]["id"]

    # Update
    patch_res = client.patch(
        f"/api/v1/projects/{project_id}",
        json={"name": "Updated Project Name", "status": "active"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["name"] == "Updated Project Name"
    assert patch_res.json()["data"]["status"] == "active"

    # Delete
    del_res = client.delete(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify not found
    get_res = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert get_res.status_code == 404


def test_project_members(client, auth_headers, db_session, test_user):
    """Test adding and removing project members linked to contacts."""
    # Create a contact
    contact = Contact(user_id=test_user.id, name="Alice Smith", email="alice@example.com")
    db_session.add(contact)
    db_session.commit()
    db_session.refresh(contact)

    # Create project
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Member Project"},
        headers=auth_headers,
    )
    project_id = proj_res.json()["data"]["id"]

    # Add member
    add_member_res = client.post(
        f"/api/v1/projects/{project_id}/members",
        json={"contact_id": str(contact.id), "role": "Lead Architect"},
        headers=auth_headers,
    )
    assert add_member_res.status_code == 201
    member_data = add_member_res.json()["data"]
    assert member_data["role"] == "Lead Architect"
    member_id = member_data["id"]

    # Check project returns member
    get_proj = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert len(get_proj.json()["data"]["members"]) == 1

    # Remove member
    del_member_res = client.delete(
        f"/api/v1/projects/{project_id}/members/{member_id}",
        headers=auth_headers,
    )
    assert del_member_res.status_code == 200

    # Verify member removed
    get_proj2 = client.get(f"/api/v1/projects/{project_id}", headers=auth_headers)
    assert len(get_proj2.json()["data"]["members"]) == 0


def test_project_board_and_card_movement(client, auth_headers):
    """Test Kanban board retrieval, column creation, card placement, and moving cards."""
    proj_res = client.post(
        "/api/v1/projects",
        json={"name": "Kanban Project"},
        headers=auth_headers,
    )
    project_id = proj_res.json()["data"]["id"]

    # Get project board
    board_res = client.get(f"/api/v1/projects/{project_id}/board", headers=auth_headers)
    assert board_res.status_code == 200
    board_data = board_res.json()["data"]
    board_id = board_data["id"]
    columns = board_data["columns"]
    assert len(columns) == 3  # To Do, In Progress, Done
    todo_col_id = columns[0]["id"]
    in_prog_col_id = columns[1]["id"]

    # Add a new custom column
    col_res = client.post(
        f"/api/v1/boards/{board_id}/columns",
        json={"name": "Testing", "color": "#a855f7"},
        headers=auth_headers,
    )
    assert col_res.status_code == 201
    assert col_res.json()["data"]["name"] == "Testing"

    # Create a task and add as a card
    task_res = client.post(
        "/api/v1/tasks",
        json={"title": "Feature Card Task", "project_id": project_id},
        headers=auth_headers,
    )
    task_id = task_res.json()["data"]["id"]

    card_res = client.post(
        "/api/v1/boards/cards",
        json={"column_id": todo_col_id, "task_id": task_id, "position": 0},
        headers=auth_headers,
    )
    assert card_res.status_code == 201
    card_id = card_res.json()["data"]["id"]

    # Move card to In Progress
    move_res = client.patch(
        f"/api/v1/boards/cards/{card_id}/move",
        json={"column_id": in_prog_col_id, "position": 0},
        headers=auth_headers,
    )
    assert move_res.status_code == 200
    assert move_res.json()["data"]["column_id"] == in_prog_col_id

    # Verify board state
    updated_board = client.get(f"/api/v1/boards/{board_id}", headers=auth_headers).json()["data"]
    in_prog_col = next(c for c in updated_board["columns"] if c["id"] == in_prog_col_id)
    assert len(in_prog_col["cards"]) == 1
    assert in_prog_col["cards"][0]["id"] == card_id


def test_project_multi_user_isolation(client, auth_headers, second_auth_headers):
    """Test user A cannot read, update, or delete user B's project."""
    create_res = client.post(
        "/api/v1/projects",
        json={"name": "User A Private Project"},
        headers=auth_headers,
    )
    project_id = create_res.json()["data"]["id"]

    # User B attempts access
    assert client.get(f"/api/v1/projects/{project_id}", headers=second_auth_headers).status_code == 404
    assert client.patch(f"/api/v1/projects/{project_id}", json={"name": "Hacked"}, headers=second_auth_headers).status_code == 404
    assert client.delete(f"/api/v1/projects/{project_id}", headers=second_auth_headers).status_code == 404
    assert client.get(f"/api/v1/projects/{project_id}/board", headers=second_auth_headers).status_code == 404
