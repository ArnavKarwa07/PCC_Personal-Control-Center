"""Tests for Background Worker System and Tasks."""

from datetime import date, datetime, timedelta, timezone

from app.models.integration import Integration, IntegrationProvider, IntegrationStatus
from app.models.notification import Notification, NotificationType
from app.models.reminder import Reminder, ReminderStatus
from app.models.task import RecurrencePattern, Task, TaskRecurrence, TaskStatus
from worker.main import (
    dispatch_pending_reminders,
    poll_external_sync,
    process_recurring_tasks,
    run_worker_iteration,
)


def test_dispatch_pending_reminders(db_session, test_user):
    """Test background worker dispatches due reminders and generates notifications."""
    now = datetime.now(timezone.utc)

    # 1. Past due pending reminder
    r_due = Reminder(
        user_id=test_user.id,
        title="Due Reminder",
        description="Must be sent now",
        remind_at=now - timedelta(minutes=5),
        status=ReminderStatus.PENDING,
    )
    # 2. Future pending reminder
    r_future = Reminder(
        user_id=test_user.id,
        title="Future Reminder",
        remind_at=now + timedelta(hours=5),
        status=ReminderStatus.PENDING,
    )
    # 3. Snoozed reminder whose snooze expired
    r_snoozed_due = Reminder(
        user_id=test_user.id,
        title="Snoozed Due Reminder",
        remind_at=now - timedelta(hours=1),
        status=ReminderStatus.SNOOZED,
        snoozed_until=now - timedelta(minutes=2),
    )

    db_session.add_all([r_due, r_future, r_snoozed_due])
    db_session.commit()

    # Run dispatch task
    dispatched = dispatch_pending_reminders(db_session)
    assert dispatched == 2

    # Verify statuses
    db_session.refresh(r_due)
    db_session.refresh(r_future)
    db_session.refresh(r_snoozed_due)

    assert r_due.status == ReminderStatus.SENT
    assert r_snoozed_due.status == ReminderStatus.SENT
    assert r_future.status == ReminderStatus.PENDING

    # Verify notifications created
    notifs = (
        db_session.query(Notification)
        .filter(Notification.user_id == test_user.id, Notification.type == NotificationType.TASK_REMINDER)
        .all()
    )
    assert len(notifs) == 2
    titles = [n.title for n in notifs]
    assert "Reminder: Due Reminder" in titles
    assert "Reminder: Snoozed Due Reminder" in titles


def test_process_recurring_tasks(db_session, test_user):
    """Test worker generates next task instances for due recurring tasks."""
    today = date.today()

    # Create task with recurring rule due today
    task = Task(
        user_id=test_user.id,
        title="Daily Standup Meeting",
        description="Team daily checkin",
        status=TaskStatus.DONE,
        due_date=today - timedelta(days=1),
    )
    db_session.add(task)
    db_session.flush()

    recurrence = TaskRecurrence(
        user_id=test_user.id,
        task_id=task.id,
        pattern=RecurrencePattern.DAILY,
        interval=1,
        next_occurrence=today,
    )
    db_session.add(recurrence)
    db_session.commit()

    # Process recurring tasks
    generated_count = process_recurring_tasks(db_session)
    assert generated_count == 1

    # Verify new task exists
    tasks = db_session.query(Task).filter(Task.user_id == test_user.id).all()
    assert len(tasks) == 2
    new_task = [t for t in tasks if t.id != task.id][0]
    assert new_task.title == "Daily Standup Meeting"
    assert new_task.status == TaskStatus.TODO
    assert new_task.due_date == today

    # Verify notification created
    notif = (
        db_session.query(Notification)
        .filter(Notification.user_id == test_user.id, Notification.type == NotificationType.RECURRING_TASK)
        .first()
    )
    assert notif is not None
    assert "Daily Standup Meeting" in notif.title


def test_poll_external_sync(db_session, test_user):
    """Test worker poll_external_sync scans active integrations."""
    # Create connected GitHub integration
    gh = Integration(
        user_id=test_user.id,
        provider=IntegrationProvider.GITHUB,
        status=IntegrationStatus.CONNECTED,
        config={"username": "testdev", "synced_repos_count": 3},
    )
    # Create disconnected Google Calendar integration
    gcal = Integration(
        user_id=test_user.id,
        provider=IntegrationProvider.GOOGLE_CALENDAR,
        status=IntegrationStatus.DISCONNECTED,
    )
    db_session.add_all([gh, gcal])
    db_session.commit()

    stats = poll_external_sync(db_session)
    assert stats["github_synced"] == 1
    assert stats["calendar_synced"] == 0
    assert stats["total_synced"] == 1


def test_run_worker_iteration(db_session, test_user):
    """Test single worker cycle execution summary."""
    summary = run_worker_iteration(db_session)
    assert "reminders_dispatched" in summary
    assert "tasks_processed" in summary
    assert "sync_stats" in summary
