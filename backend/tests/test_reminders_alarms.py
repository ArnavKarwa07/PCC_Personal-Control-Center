"""Tests for Reminders, Alarms, Timers, and Notifications APIs in single-tenant mode."""

from datetime import datetime, timedelta, timezone

# ==========================================
# 1. REMINDERS TESTS
# ==========================================


def test_create_reminder(client, auth_headers):
    """Test creating a new reminder."""
    remind_at = (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat()
    payload = {
        "title": "Review Q3 Roadmap",
        "description": "Prepare summary notes for team review",
        "remind_at": remind_at,
        "is_recurring": False,
    }
    response = client.post("/api/v1/reminders/create_reminder", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()["data"]
    assert data["title"] == "Review Q3 Roadmap"
    assert data["status"] == "pending"
    assert data["is_recurring"] is False
    assert "id" in data


def test_list_reminders_and_filters(client, auth_headers):
    """Test listing reminders with status and date filters."""
    now = datetime.now(timezone.utc)
    r1 = {
        "title": "Dentist Appointment",
        "remind_at": (now + timedelta(hours=1)).isoformat(),
        "is_recurring": False,
    }
    r2 = {
        "title": "Weekly Grocery Run",
        "remind_at": (now + timedelta(days=2)).isoformat(),
        "is_recurring": True,
    }
    client.post("/api/v1/reminders/create_reminder", json=r1, headers=auth_headers)
    client.post("/api/v1/reminders/create_reminder", json=r2, headers=auth_headers)

    # List all
    res = client.get("/api/v1/reminders/list_reminders", headers=auth_headers)
    assert res.status_code == 200
    json_data = res.json()
    assert len(json_data["data"]) == 2
    assert json_data["meta"]["total"] == 2

    # Filter is_recurring
    res_rec = client.get("/api/v1/reminders/list_reminders?is_recurring=true", headers=auth_headers)
    assert len(res_rec.json()["data"]) == 1
    assert res_rec.json()["data"][0]["title"] == "Weekly Grocery Run"


def test_get_and_update_reminder(client, auth_headers):
    """Test retrieving and updating a reminder."""
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/reminders/create_reminder",
        json={"title": "Team Sync", "remind_at": (now + timedelta(hours=1)).isoformat()},
        headers=auth_headers,
    )
    reminder_id = create_res.json()["data"]["id"]

    # Get single
    get_res = client.get(f"/api/v1/reminders/get_reminder_by_id/{reminder_id}", headers=auth_headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["title"] == "Team Sync"

    # Update
    patch_res = client.patch(
        f"/api/v1/reminders/update_reminder_by_id/{reminder_id}",
        json={"title": "Updated Team Sync", "description": "Discuss sprint retro"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["title"] == "Updated Team Sync"
    assert patch_res.json()["data"]["description"] == "Discuss sprint retro"


def test_snooze_reminder(client, auth_headers):
    """Test snoozing a reminder."""
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/reminders/create_reminder",
        json={"title": "Pay Electricity Bill", "remind_at": now.isoformat()},
        headers=auth_headers,
    )
    reminder_id = create_res.json()["data"]["id"]

    # Snooze by 15 minutes
    snooze_res = client.post(
        f"/api/v1/reminders/snooze_reminder_by_id/{reminder_id}",
        json={"snooze_minutes": 15},
        headers=auth_headers,
    )
    assert snooze_res.status_code == 200
    data = snooze_res.json()["data"]
    assert data["status"] == "snoozed"
    assert data["snoozed_until"] is not None


def test_delete_reminder(client, auth_headers):
    """Test soft deleting a reminder."""
    now = datetime.now(timezone.utc)
    create_res = client.post(
        "/api/v1/reminders/create_reminder",
        json={"title": "Private Note Reminder", "remind_at": now.isoformat()},
        headers=auth_headers,
    )
    reminder_id = create_res.json()["data"]["id"]

    # Delete
    del_res = client.delete(f"/api/v1/reminders/delete_reminder_by_id/{reminder_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Subsequent GET returns 404
    get_res = client.get(f"/api/v1/reminders/get_reminder_by_id/{reminder_id}", headers=auth_headers)
    assert get_res.status_code == 404


# ==========================================
# 2. ALARMS TESTS
# ==========================================


def test_create_and_list_alarms(client, auth_headers):
    """Test creating and listing alarms."""
    payload = {
        "label": "Morning Wakeup",
        "time": "06:45:00",
        "days_of_week": "MO,TU,WE,TH,FR",
        "is_recurring": True,
        "is_enabled": True,
    }
    res = client.post("/api/v1/alarms/create_alarm", json=payload, headers=auth_headers)
    assert res.status_code == 201
    alarm = res.json()["data"]
    assert alarm["label"] == "Morning Wakeup"
    assert alarm["time"] == "06:45:00"
    assert alarm["is_enabled"] is True

    # List alarms
    list_res = client.get("/api/v1/alarms/list_alarms", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 1


def test_toggle_and_update_alarm(client, auth_headers):
    """Test toggling and updating alarm state."""
    res = client.post(
        "/api/v1/alarms/create_alarm",
        json={"label": "Gym Alarm", "time": "05:30:00", "is_enabled": True},
        headers=auth_headers,
    )
    alarm_id = res.json()["data"]["id"]

    # Toggle off
    toggle_res = client.patch(f"/api/v1/alarms/toggle_alarm_by_id/{alarm_id}", headers=auth_headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["data"]["is_enabled"] is False

    # Toggle on
    toggle_res2 = client.patch(f"/api/v1/alarms/toggle_alarm_by_id/{alarm_id}", headers=auth_headers)
    assert toggle_res2.status_code == 200
    assert toggle_res2.json()["data"]["is_enabled"] is True

    # Update label & time
    patch_res = client.patch(
        f"/api/v1/alarms/update_alarm_by_id/{alarm_id}",
        json={"label": "Evening Gym Alarm", "time": "18:00:00"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["label"] == "Evening Gym Alarm"
    assert patch_res.json()["data"]["time"] == "18:00:00"


def test_alarm_delete(client, auth_headers):
    """Test alarm deletion."""
    res = client.post(
        "/api/v1/alarms/create_alarm",
        json={"label": "Secret Alarm", "time": "12:00:00"},
        headers=auth_headers,
    )
    alarm_id = res.json()["data"]["id"]

    # Delete
    del_res = client.delete(f"/api/v1/alarms/delete_alarm_by_id/{alarm_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Ensure soft deleted
    get_res = client.get(f"/api/v1/alarms/get_alarm_by_id/{alarm_id}", headers=auth_headers)
    assert get_res.status_code == 404


# ==========================================
# 3. TIMERS TESTS
# ==========================================


def test_create_and_state_machine_timer(client, auth_headers):
    """Test timer creation and full state transitions (start, pause, reset, complete)."""
    payload = {
        "label": "Focus Pomodoro",
        "timer_type": "pomodoro",
        "duration_seconds": 1500,
        "remaining_seconds": 1500,
        "preset_name": "Standard 25min",
    }
    create_res = client.post("/api/v1/timers/create_timer", json=payload, headers=auth_headers)
    assert create_res.status_code == 201
    timer = create_res.json()["data"]
    assert timer["status"] == "idle"
    assert timer["duration_seconds"] == 1500
    timer_id = timer["id"]

    # 1. Start timer
    start_res = client.patch(
        f"/api/v1/timers/update_timer_state_by_id/{timer_id}",
        json={"action": "start"},
        headers=auth_headers,
    )
    assert start_res.status_code == 200
    assert start_res.json()["data"]["status"] == "running"
    assert start_res.json()["data"]["started_at"] is not None

    # 2. Pause timer with updated remaining time
    pause_res = client.patch(
        f"/api/v1/timers/update_timer_state_by_id/{timer_id}",
        json={"action": "pause", "remaining_seconds": 1200},
        headers=auth_headers,
    )
    assert pause_res.status_code == 200
    assert pause_res.json()["data"]["status"] == "paused"
    assert pause_res.json()["data"]["remaining_seconds"] == 1200

    # 3. Reset timer
    reset_res = client.patch(
        f"/api/v1/timers/update_timer_state_by_id/{timer_id}",
        json={"action": "reset"},
        headers=auth_headers,
    )
    assert reset_res.status_code == 200
    assert reset_res.json()["data"]["status"] == "idle"
    assert reset_res.json()["data"]["remaining_seconds"] == 1500
    assert reset_res.json()["data"]["started_at"] is None

    # 4. Complete timer
    complete_res = client.patch(
        f"/api/v1/timers/update_timer_state_by_id/{timer_id}",
        json={"action": "complete"},
        headers=auth_headers,
    )
    assert complete_res.status_code == 200
    assert complete_res.json()["data"]["status"] == "completed"
    assert complete_res.json()["data"]["remaining_seconds"] == 0


def test_timer_delete(client, auth_headers):
    """Test timer deletion."""
    create_res = client.post(
        "/api/v1/timers/create_timer",
        json={"label": "Tea Timer", "timer_type": "countdown", "duration_seconds": 180},
        headers=auth_headers,
    )
    timer_id = create_res.json()["data"]["id"]

    # Delete
    del_res = client.delete(f"/api/v1/timers/delete_timer_by_id/{timer_id}", headers=auth_headers)
    assert del_res.status_code == 200

    # Verify 404
    get_res = client.get(f"/api/v1/timers/get_timer_by_id/{timer_id}", headers=auth_headers)
    assert get_res.status_code == 404


# ==========================================
# 4. NOTIFICATIONS TESTS
# ==========================================


def test_notifications_crud_and_read_all(client, auth_headers, db_session, test_user):
    """Test notification list, read state changes, and read-all."""
    from app.models.notification import (
        Notification,
        NotificationChannel,
        NotificationDeliveryStatus,
        NotificationType,
    )

    # Seed 2 notifications for test user
    n1 = Notification(
        user_id=test_user.id,
        title="Welcome to PCC",
        message="Your workspace is ready",
        type=NotificationType.SYSTEM,
        channel=NotificationChannel.IN_APP,
        status=NotificationDeliveryStatus.PENDING,
    )
    n2 = Notification(
        user_id=test_user.id,
        title="Upcoming Task Deadline",
        message="Sprint planning in 1 hour",
        type=NotificationType.DEADLINE,
        channel=NotificationChannel.IN_APP,
        status=NotificationDeliveryStatus.PENDING,
    )
    db_session.add_all([n1, n2])
    db_session.commit()
    db_session.refresh(n1)
    db_session.refresh(n2)

    # List notifications
    list_res = client.get("/api/v1/notifications/list_notifications", headers=auth_headers)
    assert list_res.status_code == 200
    assert len(list_res.json()["data"]) == 2

    # Mark single as read
    read_res = client.patch(f"/api/v1/notifications/mark_notification_as_read/{n1.id}", headers=auth_headers)
    assert read_res.status_code == 200
    assert read_res.json()["data"]["status"] == "read"
    assert read_res.json()["data"]["read_at"] is not None

    # Filter unread only
    unread_res = client.get("/api/v1/notifications/list_notifications?unread_only=true", headers=auth_headers)
    assert len(unread_res.json()["data"]) == 1
    assert unread_res.json()["data"][0]["id"] == str(n2.id)

    # Mark all as read
    all_read_res = client.patch("/api/v1/notifications/mark_all_notifications_as_read", headers=auth_headers)
    assert all_read_res.status_code == 200
    assert all_read_res.json()["data"]["count"] >= 1

    # Unread should now be 0
    unread_res_after = client.get("/api/v1/notifications/list_notifications?unread_only=true", headers=auth_headers)
    assert len(unread_res_after.json()["data"]) == 0

    # Delete single notification
    del_res = client.delete(f"/api/v1/notifications/delete_notification_by_id/{n1.id}", headers=auth_headers)
    assert del_res.status_code == 200


# ==========================================
# 5. NEGATIVE AND ROUTE CONTRACT TESTS
# ==========================================


def test_reminders_alarms_timers_negative_missing_payload_fields(client, auth_headers):
    """Test 422 payload validation error format when fields are missing or invalid."""
    res_r = client.post("/api/v1/reminders/create_reminder", json={}, headers=auth_headers)
    assert res_r.status_code == 422
    assert res_r.json()["error"]["code"] == "VALIDATION_ERROR"

    res_a = client.post("/api/v1/alarms/create_alarm", json={}, headers=auth_headers)
    assert res_a.status_code == 422
    assert res_a.json()["error"]["code"] == "VALIDATION_ERROR"

    res_t = client.post("/api/v1/timers/create_timer", json={"duration_seconds": ["invalid", "list"]}, headers=auth_headers)
    assert res_t.status_code == 422
    assert res_t.json()["error"]["code"] == "VALIDATION_ERROR"


def test_reminders_alarms_timers_negative_nonexistent_resource_lookup(client, auth_headers):
    """Test 404 format on non-existent resource ID operations."""
    import uuid

    fake_id = str(uuid.uuid4())

    assert client.get(f"/api/v1/reminders/get_reminder_by_id/{fake_id}", headers=auth_headers).status_code == 404
    assert client.get(f"/api/v1/reminders/get_reminder_by_id/{fake_id}", headers=auth_headers).json()["error"]["code"] in ("REMINDER_NOT_FOUND", "NOT_FOUND")
    assert client.patch(f"/api/v1/reminders/update_reminder_by_id/{fake_id}", json={"title": "X"}, headers=auth_headers).status_code == 404
    assert client.delete(f"/api/v1/reminders/delete_reminder_by_id/{fake_id}", headers=auth_headers).status_code == 404

    assert client.patch(f"/api/v1/alarms/toggle_alarm_by_id/{fake_id}", headers=auth_headers).status_code == 404
    assert client.patch(f"/api/v1/alarms/toggle_alarm_by_id/{fake_id}", headers=auth_headers).json()["error"]["code"] in ("ALARM_NOT_FOUND", "NOT_FOUND")
    assert client.delete(f"/api/v1/alarms/delete_alarm_by_id/{fake_id}", headers=auth_headers).status_code == 404

    assert client.get(f"/api/v1/timers/get_timer_by_id/{fake_id}", headers=auth_headers).status_code == 404
    assert client.get(f"/api/v1/timers/get_timer_by_id/{fake_id}", headers=auth_headers).json()["error"]["code"] in ("TIMER_NOT_FOUND", "NOT_FOUND")
    assert client.delete(f"/api/v1/timers/delete_timer_by_id/{fake_id}", headers=auth_headers).status_code == 404

    assert client.patch(f"/api/v1/notifications/mark_notification_as_read/{fake_id}", headers=auth_headers).status_code == 404
    assert client.patch(f"/api/v1/notifications/mark_notification_as_read/{fake_id}", headers=auth_headers).json()["error"]["code"] in ("NOTIFICATION_NOT_FOUND", "NOT_FOUND")


def test_reminders_alarms_timers_operation_ids_and_route_contracts(client):
    """Test REST operation_id presence and route contract responses for reminders, alarms, timers, notifications."""
    openapi = client.app.openapi()
    endpoints = [
        ("/api/v1/reminders/list_reminders", "get"),
        ("/api/v1/reminders/create_reminder", "post"),
        ("/api/v1/reminders/get_reminder_by_id/{reminder_id}", "get"),
        ("/api/v1/reminders/update_reminder_by_id/{reminder_id}", "patch"),
        ("/api/v1/reminders/delete_reminder_by_id/{reminder_id}", "delete"),
        ("/api/v1/reminders/snooze_reminder_by_id/{reminder_id}", "post"),
        ("/api/v1/alarms/list_alarms", "get"),
        ("/api/v1/alarms/create_alarm", "post"),
        ("/api/v1/alarms/get_alarm_by_id/{alarm_id}", "get"),
        ("/api/v1/alarms/update_alarm_by_id/{alarm_id}", "patch"),
        ("/api/v1/alarms/delete_alarm_by_id/{alarm_id}", "delete"),
        ("/api/v1/alarms/toggle_alarm_by_id/{alarm_id}", "patch"),
        ("/api/v1/timers/list_timers", "get"),
        ("/api/v1/timers/create_timer", "post"),
        ("/api/v1/timers/get_timer_by_id/{timer_id}", "get"),
        ("/api/v1/timers/update_timer_by_id/{timer_id}", "patch"),
        ("/api/v1/timers/delete_timer_by_id/{timer_id}", "delete"),
        ("/api/v1/timers/update_timer_state_by_id/{timer_id}", "patch"),
        ("/api/v1/notifications/list_notifications", "get"),
        ("/api/v1/notifications/mark_notification_as_read/{notification_id}", "patch"),
        ("/api/v1/notifications/mark_all_notifications_as_read", "patch"),
        ("/api/v1/notifications/delete_notification_by_id/{notification_id}", "delete"),
    ]
    for path, method in endpoints:
        assert path in openapi["paths"], f"Path {path} missing in OpenAPI schema"
        assert method in openapi["paths"][path], f"Method {method} for {path} missing"
        op_id = openapi["paths"][path][method].get("operationId")
        assert op_id and isinstance(op_id, str), f"Missing operationId for {method.upper()} {path}"
