"""AI Executive Assistant service layer with natural language query parsing and briefing generator."""

import uuid
from datetime import date
from typing import Dict

from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent
from app.models.note import Note
from app.models.notification import Notification, NotificationDeliveryStatus
from app.models.reminder import Reminder, ReminderStatus
from app.models.task import Task, TaskStatus
from app.schemas.assistant import AssistantAction, AssistantQueryRequest, AssistantQueryResponse, DailyBriefingRead


class AssistantService:
    """Service dispatcher for natural language execution and automated executive summaries."""

    def process_query(self, db: Session, user_id: uuid.UUID, request: AssistantQueryRequest) -> AssistantQueryResponse:
        q = request.query.lower().strip()

        if "task" in q or "todo" in q or "remind me to" in q:
            # Task creation abstraction
            title = request.query.replace("create task", "").replace("remind me to", "").strip().capitalize()
            if not title:
                title = "New Assistant Task"
            task = Task(user_id=user_id, title=title, status=TaskStatus.TODO)
            db.add(task)
            db.commit()
            db.refresh(task)

            return AssistantQueryResponse(
                summary=f"Created task: '{title}'",
                intent_detected="CREATE_TASK",
                executed_action=AssistantAction(
                    action_type="create_task",
                    label=f"Task #{str(task.id)[:8]} Created",
                    payload={"task_id": str(task.id), "title": task.title},
                ),
                suggested_followups=["View my task list", "Set priority for this task"],
            )

        elif "note" in q or "idea" in q or "jot" in q:
            # Note creation abstraction
            content = request.query.replace("take note", "").replace("jot down", "").strip()
            note = Note(user_id=user_id, title="Assistant Note", content=content)
            db.add(note)
            db.commit()
            db.refresh(note)

            return AssistantQueryResponse(
                summary="Recorded note into knowledge inbox.",
                intent_detected="CREATE_NOTE",
                executed_action=AssistantAction(
                    action_type="create_note",
                    label=f"Note #{str(note.id)[:8]} Created",
                    payload={"note_id": str(note.id)},
                ),
                suggested_followups=["Open Notes workspace", "Pin this note"],
            )

        else:
            # Informational query dispatcher
            pending_count = db.query(Task).filter(Task.user_id == user_id, Task.status != TaskStatus.DONE).count()
            return AssistantQueryResponse(
                summary=f"PCC Assistant operational. You currently have {pending_count} pending tasks across your workspace.",
                intent_detected="GENERAL_QUERY",
                suggested_followups=[
                    "What are my high priority tasks?",
                    "Generate my daily briefing",
                    "Summarize financial standing",
                ],
            )

    def generate_daily_briefing(self, db: Session, user_id: uuid.UUID) -> DailyBriefingRead:
        pending_tasks = db.query(Task).filter(Task.user_id == user_id, Task.status != TaskStatus.DONE).count()
        upcoming_events = db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).count()
        overdue_reminders = db.query(Reminder).filter(Reminder.user_id == user_id, Reminder.status == ReminderStatus.PENDING).count()
        unread_notifications = db.query(Notification).filter(Notification.user_id == user_id, Notification.status != NotificationDeliveryStatus.READ).count()

        summary_text = (
            f"Good day! You have {pending_tasks} open tasks, {upcoming_events} scheduled calendar events, "
            f"and {overdue_reminders} pending reminders."
        )

        recommendation = "Focus on completing your top priority task and clearing overdue reminders first."

        return DailyBriefingRead(
            date_str=date.today().isoformat(),
            greeting="Welcome back to your Executive Assistant",
            pending_tasks_count=pending_tasks,
            upcoming_events_count=upcoming_events,
            overdue_reminders_count=overdue_reminders,
            unread_notifications_count=unread_notifications,
            executive_summary=summary_text,
            focus_recommendation=recommendation,
        )


assistant_service = AssistantService()
