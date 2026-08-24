"""Integration tests for audit verifications and payload contract fixes."""

from datetime import datetime, timedelta, timezone


def test_project_partial_update_preserves_name(client, auth_headers):
    """Verify that updating project status/progress does not overwrite the project name."""
    create_res = client.post(
        "/api/v1/projects/create_project",
        json={"name": "Important Alpha Project", "status": "active", "priority": "high"},
        headers=auth_headers,
    )
    assert create_res.status_code == 201
    project_id = create_res.json()["data"]["id"]

    # Partial update progress only
    update_res = client.patch(
        f"/api/v1/projects/update_project_by_id/{project_id}",
        json={"progress": 75.0, "status": "completed"},
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    updated = update_res.json()["data"]
    assert updated["name"] == "Important Alpha Project"
    assert updated["progress"] == 75.0
    assert updated["status"] == "completed"


def test_reminder_snooze_payload_parsing(client, auth_headers):
    """Verify reminder snooze handles snake_case snooze_until and snooze_minutes parameters."""
    rem_res = client.post(
        "/api/v1/reminders/create_reminder",
        json={
            "title": "Team Standup Alert",
            "remind_at": (datetime.now(timezone.utc) + timedelta(days=1)).isoformat(),
        },
        headers=auth_headers,
    )
    assert rem_res.status_code == 201
    reminder_id = rem_res.json()["data"]["id"]

    target_snooze = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    snooze_res = client.post(
        f"/api/v1/reminders/snooze_reminder_by_id/{reminder_id}",
        json={"snooze_until": target_snooze, "snooze_minutes": 120},
        headers=auth_headers,
    )
    assert snooze_res.status_code == 200
    data = snooze_res.json()["data"]
    assert data["snoozed_until"] is not None


def test_idea_promote_request_payload(client, auth_headers):
    """Verify idea promotion payload with promote_to and target_name."""
    idea_res = client.post(
        "/api/v1/ideas/create_idea",
        json={"title": "Automated Cloud Deployment Workflow", "description": "Auto-deploy on git tag."},
        headers=auth_headers,
    )
    assert idea_res.status_code == 201
    idea_id = idea_res.json()["data"]["id"]

    promote_res = client.post(
        f"/api/v1/ideas/promote_idea_by_id/{idea_id}",
        json={"promote_to": "task", "target_name": "Implement Auto-Deploy GitHub Action"},
        headers=auth_headers,
    )
    assert promote_res.status_code == 200
    res_body = promote_res.json()
    assert "data" in res_body
    assert res_body["data"]["idea"]["status"] == "promoted"


def test_goal_milestone_update_persistence(client, auth_headers):
    """Verify updating a goal with milestones persists milestones in the database."""
    goal_res = client.post(
        "/api/v1/goals/create_goal",
        json={"name": "Launch PCC v1.0.0", "time_period": "Q3 2026", "progress": 0.0},
        headers=auth_headers,
    )
    assert goal_res.status_code == 201
    goal_id = goal_res.json()["data"]["id"]

    update_res = client.patch(
        f"/api/v1/goals/update_goal_by_id/{goal_id}",
        json={
            "progress": 50.0,
            "milestones": [
                {"name": "Frontend Audit Complete", "completed": True},
                {"name": "Backend Test Suite Passing", "completed": True},
                {"name": "Cross-Platform Installer Build", "completed": False},
            ],
        },
        headers=auth_headers,
    )
    assert update_res.status_code == 200
    u_data = update_res.json()["data"]
    assert len(u_data["milestones"]) == 3
    assert u_data["milestones"][0]["name"] == "Frontend Audit Complete"


def test_list_envelope_structure(client, auth_headers):
    """Verify REST list endpoints return structured response envelope containing data array and meta object."""
    endpoints = [
        "/api/v1/tasks/list_tasks",
        "/api/v1/projects/list_projects",
        "/api/v1/notes/list_notes",
        "/api/v1/ideas/list_ideas",
        "/api/v1/calendar/events/list_calendar_events",
        "/api/v1/goals/list_goals",
        "/api/v1/contacts/list_contacts",
        "/api/v1/reminders/list_reminders",
    ]
    for ep in endpoints:
        res = client.get(ep, headers=auth_headers)
        assert res.status_code == 200
        json_body = res.json()
        assert "data" in json_body
        assert isinstance(json_body["data"], list)
        assert "meta" in json_body
