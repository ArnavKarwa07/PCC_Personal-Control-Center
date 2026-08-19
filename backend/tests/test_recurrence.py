"""Tests for Task Recurrence Engine and Next-Occurrence Calculations."""

from datetime import date

from app.models.task import RecurrencePattern
from app.services.task_service import calculate_next_occurrence


def test_calculate_next_occurrence_patterns():
    """Unit test calculate_next_occurrence across all recurrence patterns."""
    base_date = date(2026, 8, 15)  # Saturday

    # 1. Daily pattern
    next_daily = calculate_next_occurrence(pattern=RecurrencePattern.DAILY, interval=1, current_date=base_date)
    assert next_daily == date(2026, 8, 16)

    next_daily_3 = calculate_next_occurrence(pattern=RecurrencePattern.DAILY, interval=3, current_date=base_date)
    assert next_daily_3 == date(2026, 8, 18)

    # 2. Weekly pattern (no specific days)
    next_weekly = calculate_next_occurrence(pattern=RecurrencePattern.WEEKLY, interval=1, current_date=base_date)
    assert next_weekly == date(2026, 8, 22)

    # 3. Weekly pattern with days_of_week
    # Saturday 2026-08-15 (weekday 5). Target days: Mon (0), Wed (2).
    # Since today is Sat (5), next matching day is Mon (0) next week -> 2026-08-17
    next_mon = calculate_next_occurrence(
        pattern=RecurrencePattern.WEEKLY,
        interval=1,
        current_date=base_date,
        days_of_week="MO,WE",
    )
    assert next_mon == date(2026, 8, 17)

    # Monday 2026-08-17. Target days: Mon (0), Wed (2). Next should be Wed 2026-08-19.
    next_wed = calculate_next_occurrence(
        pattern=RecurrencePattern.WEEKLY,
        interval=1,
        current_date=date(2026, 8, 17),
        days_of_week="MO,WE",
    )
    assert next_wed == date(2026, 8, 19)

    # 4. Monthly pattern
    next_month = calculate_next_occurrence(pattern=RecurrencePattern.MONTHLY, interval=1, current_date=base_date)
    assert next_month == date(2026, 9, 15)

    # Month end leap year / month length adjustment (Jan 31 -> Feb 28)
    jan_31 = date(2026, 1, 31)
    next_feb = calculate_next_occurrence(pattern=RecurrencePattern.MONTHLY, interval=1, current_date=jan_31)
    assert next_feb == date(2026, 2, 28)

    # 5. Yearly pattern
    next_year = calculate_next_occurrence(pattern=RecurrencePattern.YEARLY, interval=1, current_date=base_date)
    assert next_year == date(2027, 8, 15)

    # 6. Custom pattern (in days)
    next_custom = calculate_next_occurrence(pattern=RecurrencePattern.CUSTOM, interval=5, current_date=base_date)
    assert next_custom == date(2026, 8, 20)


def test_task_completion_generates_next_recurring_task(client, auth_headers):
    """Test completing a recurring task automatically spawns the next task instance."""
    # 1. Create a task with daily recurrence
    create_payload = {
        "title": "Daily Standup Notes",
        "description": "Prepare daily updates",
        "status": "todo",
        "priority": "medium",
        "due_date": "2026-08-15",
        "recurrence": {
            "pattern": "daily",
            "interval": 1,
        },
    }
    create_res = client.post("/api/v1/tasks/create_task", json=create_payload, headers=auth_headers)
    assert create_res.status_code == 201
    task_data = create_res.json()["data"]
    task_id = task_data["id"]
    assert task_data["recurrence"] is not None
    assert task_data["recurrence"]["pattern"] == "daily"

    # 2. Mark the task as done
    patch_res = client.patch(
        f"/api/v1/tasks/update_task_by_id/{task_id}",
        json={"status": "done"},
        headers=auth_headers,
    )
    assert patch_res.status_code == 200
    assert patch_res.json()["data"]["status"] == "done"
    assert patch_res.json()["data"]["completed_at"] is not None

    # 3. Verify that the next task instance was automatically generated
    list_res = client.get("/api/v1/tasks/list_tasks", headers=auth_headers)
    tasks = list_res.json()["data"]
    assert len(tasks) == 2

    # Find the new todo task
    new_tasks = [t for t in tasks if t["id"] != task_id]
    assert len(new_tasks) == 1
    new_task = new_tasks[0]
    assert new_task["title"] == "Daily Standup Notes"
    assert new_task["status"] == "todo"
    assert new_task["due_date"] == "2026-08-16"
    assert new_task["recurrence"] is not None
    assert new_task["recurrence"]["pattern"] == "daily"


def test_task_recurrence_respects_end_date(client, auth_headers):
    """Test recurring task does not generate next instance if end_date is exceeded."""
    create_payload = {
        "title": "Finite Recurring Task",
        "status": "todo",
        "due_date": "2026-08-15",
        "recurrence": {
            "pattern": "daily",
            "interval": 1,
            "end_date": "2026-08-15",  # Already at final occurrence
        },
    }
    create_res = client.post("/api/v1/tasks/create_task", json=create_payload, headers=auth_headers)
    task_id = create_res.json()["data"]["id"]

    # Mark as done
    client.patch(f"/api/v1/tasks/update_task_by_id/{task_id}", json={"status": "done"}, headers=auth_headers)

    # Verify no new task was generated because 2026-08-16 > end_date (2026-08-15)
    list_res = client.get("/api/v1/tasks/list_tasks", headers=auth_headers)
    tasks = list_res.json()["data"]
    assert len(tasks) == 1
    assert tasks[0]["status"] == "done"

