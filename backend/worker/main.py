"""Async background worker for scheduled jobs, reminder dispatch, and external sync."""

import asyncio
import logging
import os
import signal
import sys
from datetime import date, datetime, timezone
from typing import Any, Dict, Optional

# Ensure backend root is on sys.path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlalchemy.orm import Session  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.models.integration import Integration, IntegrationStatus  # noqa: E402
from app.models.notification import (  # noqa: E402
    Notification,
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationType,
)
from app.models.reminder import Reminder, ReminderStatus  # noqa: E402
from app.models.task import Task, TaskRecurrence, TaskStatus  # noqa: E402
from app.services.integration_service import integration_service  # noqa: E402
from app.services.task_service import calculate_next_occurrence  # noqa: E402

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [Worker] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("pcc_worker")


def dispatch_pending_reminders(db: Session) -> int:
    """Scan and dispatch pending or snoozed reminders that are due.

    For each due reminder:
    1. Mark status as SENT.
    2. Create an in-app Notification record.
    """
    now = datetime.now(timezone.utc)
    due_reminders = (
        db.query(Reminder)
        .filter(
            Reminder.deleted_at.is_(None),
            (
                (Reminder.status == ReminderStatus.PENDING) & (Reminder.remind_at <= now)
            )
            | (
                (Reminder.status == ReminderStatus.SNOOZED)
                & (Reminder.snoozed_until.isnot(None))
                & (Reminder.snoozed_until <= now)
            ),
        )
        .all()
    )

    dispatched_count = 0
    for reminder in due_reminders:
        reminder.status = ReminderStatus.SENT

        notification = Notification(
            user_id=reminder.user_id,
            title=f"Reminder: {reminder.title}",
            message=reminder.description or f"Scheduled reminder for '{reminder.title}'",
            type=NotificationType.TASK_REMINDER,
            channel=NotificationChannel.IN_APP,
            status=NotificationDeliveryStatus.PENDING,
            entity_type="reminder",
            entity_id=reminder.id,
            sent_at=now,
        )
        db.add(notification)
        dispatched_count += 1

    if dispatched_count > 0:
        db.commit()
        logger.info(f"Dispatched {dispatched_count} due reminder(s).")

    return dispatched_count


def process_recurring_tasks(db: Session) -> int:
    """Scan recurring task configurations due for next instance generation.

    Generates the next task instance if next_occurrence <= today and original task is done or scheduled.
    """
    today = date.today()
    due_recurrences = (
        db.query(TaskRecurrence)
        .filter(
            TaskRecurrence.deleted_at.is_(None),
            TaskRecurrence.next_occurrence.isnot(None),
            TaskRecurrence.next_occurrence <= today,
        )
        .all()
    )

    generated_count = 0
    for recurrence in due_recurrences:
        parent_task = (
            db.query(Task)
            .filter(Task.id == recurrence.task_id, Task.deleted_at.is_(None))
            .first()
        )
        if not parent_task:
            continue

        target_date = recurrence.next_occurrence

        # Create next task instance
        new_task = Task(
            user_id=parent_task.user_id,
            title=parent_task.title,
            description=parent_task.description,
            status=TaskStatus.TODO,
            priority=parent_task.priority,
            due_date=target_date,
            due_time=parent_task.due_time,
            project_id=parent_task.project_id,
            goal_id=parent_task.goal_id,
            estimated_minutes=parent_task.estimated_minutes,
        )
        if parent_task.tags:
            new_task.tags = list(parent_task.tags)

        db.add(new_task)
        db.flush()

        # Calculate following occurrence
        next_next = calculate_next_occurrence(
            pattern=recurrence.pattern,
            interval=recurrence.interval,
            current_date=target_date,
            days_of_week=recurrence.days_of_week,
            day_of_month=recurrence.day_of_month,
        )

        if recurrence.end_date and next_next > recurrence.end_date:
            recurrence.next_occurrence = None
        else:
            recurrence.next_occurrence = next_next

        # Create new recurrence link on generated task
        new_rec = TaskRecurrence(
            user_id=parent_task.user_id,
            task_id=new_task.id,
            pattern=recurrence.pattern,
            interval=recurrence.interval,
            days_of_week=recurrence.days_of_week,
            day_of_month=recurrence.day_of_month,
            end_date=recurrence.end_date,
            max_occurrences=recurrence.max_occurrences,
            next_occurrence=next_next,
        )
        db.add(new_rec)

        # Notify user about generated task
        notif = Notification(
            user_id=parent_task.user_id,
            title=f"Recurring task generated: {new_task.title}",
            message=f"A new task '{new_task.title}' has been scheduled for {target_date.isoformat()}.",
            type=NotificationType.RECURRING_TASK,
            channel=NotificationChannel.IN_APP,
            status=NotificationDeliveryStatus.PENDING,
            entity_type="task",
            entity_id=new_task.id,
            sent_at=datetime.now(timezone.utc),
        )
        db.add(notif)
        generated_count += 1

    if generated_count > 0:
        db.commit()
        logger.info(f"Generated {generated_count} recurring task instance(s).")

    return generated_count


def poll_external_sync(db: Session) -> Dict[str, Any]:
    """Scan and synchronize all active third-party integrations."""
    active_integrations = (
        db.query(Integration)
        .filter(
            Integration.status == IntegrationStatus.CONNECTED,
            Integration.deleted_at.is_(None),
        )
        .all()
    )

    stats = {
        "github_synced": 0,
        "calendar_synced": 0,
        "weather_synced": 0,
        "total_synced": 0,
    }

    for integration in active_integrations:
        try:
            integration_service.sync_provider(
                db=db,
                user_id=integration.user_id,
                provider=integration.provider,
            )
            provider_key = f"{integration.provider.value}_synced"
            if provider_key in stats:
                stats[provider_key] += 1
            stats["total_synced"] += 1
        except Exception as e:
            logger.warning(f"Error syncing {integration.provider.value} for user {integration.user_id}: {e}")

    return stats


def run_worker_iteration(db: Session) -> Dict[str, Any]:
    """Execute a single complete worker execution cycle."""
    reminders_dispatched = dispatch_pending_reminders(db)
    tasks_processed = process_recurring_tasks(db)
    sync_stats = poll_external_sync(db)

    return {
        "reminders_dispatched": reminders_dispatched,
        "tasks_processed": tasks_processed,
        "sync_stats": sync_stats,
    }


async def run_worker(
    poll_interval: float = 10.0,
    max_iterations: Optional[int] = None,
    stop_event: Optional[asyncio.Event] = None,
):
    """Async background worker main execution loop."""
    logger.info("Starting PCC Background Worker System...")

    iteration = 0
    while True:
        if stop_event and stop_event.is_set():
            logger.info("Stop event received. Shutting down background worker.")
            break

        iteration += 1
        logger.info(f"--- Worker Cycle #{iteration} ---")

        try:
            db = SessionLocal()
            try:
                summary = run_worker_iteration(db)
                logger.info(
                    f"Cycle #{iteration} completed: {summary['reminders_dispatched']} reminders, "
                    f"{summary['tasks_processed']} tasks, "
                    f"{summary['sync_stats']['total_synced']} synced integrations."
                )
            finally:
                db.close()
        except Exception as e:
            logger.error(f"Error during worker cycle #{iteration}: {e}")

        if max_iterations is not None and iteration >= max_iterations:
            logger.info(f"Reached max iterations ({max_iterations}). Exiting loop.")
            break

        try:
            if stop_event:
                await asyncio.wait_for(stop_event.wait(), timeout=poll_interval)
                break
            else:
                await asyncio.sleep(poll_interval)
        except asyncio.TimeoutError:
            pass

    logger.info("PCC Background Worker stopped cleanly.")


async def main():
    """CLI Entry point for background worker process."""
    stop_event = asyncio.Event()

    def handle_signal():
        logger.info("Received termination signal.")
        stop_event.set()

    loop = asyncio.get_running_loop()
    for sig in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(sig, handle_signal)
        except NotImplementedError:
            # Signal handlers not fully supported on Windows event loops
            pass

    poll_interval = float(os.getenv("WORKER_POLL_INTERVAL", "10.0"))
    await run_worker(poll_interval=poll_interval, stop_event=stop_event)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("Worker process interrupted by keyboard. Exiting.")
