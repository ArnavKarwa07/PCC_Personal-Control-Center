"""AI Executive Assistant service layer with natural language query parsing and briefing generator."""

import uuid
from datetime import date

import google.generativeai as genai
from app.core.config import settings
from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent
from app.models.note import Note
from app.models.notification import Notification, NotificationDeliveryStatus
from app.models.project import Project, ProjectStatus
from app.models.reminder import Reminder, ReminderStatus
from app.models.task import Task, TaskStatus
from app.schemas.assistant import AssistantAction, AssistantQueryRequest, AssistantQueryResponse, DailyBriefingRead


class AssistantService:
    """Service dispatcher for natural language execution and automated executive summaries."""

    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)


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
            summary_text = f"PCC Assistant operational. You currently have {pending_count} pending tasks across your workspace."
            
            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != 'AIzaSyBk_example_key_placeholder':
                try:
                    model = genai.GenerativeModel("gemini-2.0-flash")
                    prompt = "You are a Personal Control Center assistant. The user said: " + request.query
                    response = model.generate_content(prompt)
                    summary_text = response.text
                except Exception as e:
                    import logging
                    logging.getLogger("assistant_service").error("Gemini AI API error: %s", e)
                    summary_text = f"PCC Assistant operational. You currently have {pending_count} pending tasks across your workspace. (Note: Gemini AI call failed: {str(e)})"

            return AssistantQueryResponse(
                summary=summary_text,
                intent_detected="GENERAL_QUERY",
                suggested_followups=[
                    "What are my high priority tasks?",
                    "Generate my daily briefing",
                    "Review my calendar events",
                ],
            )

    def generate_daily_briefing(self, db: Session, user_id: uuid.UUID) -> DailyBriefingRead:
        pending_tasks_list = db.query(Task).filter(Task.user_id == user_id, Task.status != TaskStatus.DONE).all()
        upcoming_events_list = db.query(CalendarEvent).filter(CalendarEvent.user_id == user_id).all()
        overdue_reminders_list = db.query(Reminder).filter(Reminder.user_id == user_id, Reminder.status == ReminderStatus.PENDING).all()
        active_projects_list = db.query(Project).filter(Project.user_id == user_id, Project.status == ProjectStatus.ACTIVE).all()
        unread_notifications = db.query(Notification).filter(Notification.user_id == user_id, Notification.status != NotificationDeliveryStatus.READ).count()

        pending_tasks = len(pending_tasks_list)
        upcoming_events = len(upcoming_events_list)
        overdue_reminders = len(overdue_reminders_list)
        active_projects = len(active_projects_list)

        raw_bullet_points = []

        for r in overdue_reminders_list[:3]:
            raw_bullet_points.append(f"Reminder: {r.title}")

        for t in pending_tasks_list[:5]:
            prio = f" ({t.priority.value.upper()})" if hasattr(t, "priority") and t.priority and t.priority.value != "none" else ""
            raw_bullet_points.append(f"Task: {t.title}{prio}")

        for e in upcoming_events_list[:4]:
            t_str = f" at {e.start_time.strftime('%H:%M')}" if getattr(e, "start_time", None) else ""
            raw_bullet_points.append(f"Calendar Event: {e.title}{t_str}")

        for p in active_projects_list[:3]:
            raw_bullet_points.append(f"Active Project: {p.name}")

        if not raw_bullet_points:
            raw_bullet_points = [
                "Your Personal Control Center workspace is clean and ready.",
                "Use the quick action buttons to create your first task or project.",
                "Sync your calendar or set reminders to track upcoming events.",
            ]

        # Deduplicate bullet points while preserving order
        seen = set()
        bullet_points = []
        for bp in raw_bullet_points:
            norm = bp.strip().lower()
            if norm not in seen:
                seen.add(norm)
                bullet_points.append(bp)

        if pending_tasks == 0 and upcoming_events == 0 and active_projects == 0:
            summary_text = "Welcome to Personal Control Center! Your workspace is completely clean with no pending items."
            recommendation = "Start by adding your first project, task, or setting your goals in the workspace."
        else:
            summary_text = (
                f"Good day! You have {pending_tasks} open tasks, {upcoming_events} scheduled calendar events, "
                f"{overdue_reminders} pending reminders, and {active_projects} active projects."
            )
            recommendation = "Focus on completing your top priority task and clearing overdue reminders first."

        return DailyBriefingRead(
            date_str=date.today().isoformat(),
            greeting="Welcome back to your Executive Assistant",
            pending_tasks_count=pending_tasks,
            upcoming_events_count=upcoming_events,
            overdue_reminders_count=overdue_reminders,
            active_projects_count=active_projects,
            unread_notifications_count=unread_notifications,
            executive_summary=summary_text,
            focus_recommendation=recommendation,
            bullet_points=bullet_points,
        )



assistant_service = AssistantService()
