"""SQLAlchemy Models Registry for PCC.

All database models are imported here for Alembic auto-discovery
and declarative relationship mapping.
"""

from app.models.activity import Activity
from app.models.alarm import Alarm
from app.models.automation import Automation, AutomationRun, AutomationRunStatus
from app.models.base import BaseModel
from app.models.board import Board, BoardCard, BoardColumn
from app.models.calendar_event import CalendarEvent, CalendarEventType
from app.models.contact import Contact
from app.models.document import Document
from app.models.goal import Goal, GoalMilestone, GoalStatus
from app.models.idea import Idea, IdeaStatus
from app.models.integration import (
    Integration,
    IntegrationProvider,
    IntegrationStatus,
    IntegrationToken,
)
from app.models.note import Note
from app.models.notification import (
    Notification,
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationType,
)
from app.models.project import (
    Project,
    ProjectMember,
    ProjectPriority,
    ProjectStatus,
    ProjectTag,
)
from app.models.reminder import Reminder, ReminderStatus
from app.models.tag import Tag
from app.models.task import (
    RecurrencePattern,
    Task,
    TaskDependency,
    TaskPriority,
    TaskRecurrence,
    TaskStatus,
    TaskTag,
)
from app.models.timer import TimerModel, TimerState, TimerType
from app.models.user import User

__all__ = [
    "BaseModel",
    "User",
    "Tag",
    "Contact",
    "Goal",
    "GoalMilestone",
    "GoalStatus",
    "Project",
    "ProjectMember",
    "ProjectPriority",
    "ProjectStatus",
    "ProjectTag",
    "Task",
    "TaskRecurrence",
    "TaskDependency",
    "TaskTag",
    "TaskPriority",
    "TaskStatus",
    "RecurrencePattern",
    "Board",
    "BoardColumn",
    "BoardCard",
    "CalendarEvent",
    "CalendarEventType",
    "Reminder",
    "ReminderStatus",
    "Alarm",
    "TimerModel",
    "TimerState",
    "TimerType",
    "Note",
    "Idea",
    "IdeaStatus",
    "Document",
    "Notification",
    "NotificationChannel",
    "NotificationDeliveryStatus",
    "NotificationType",
    "Automation",
    "AutomationRun",
    "AutomationRunStatus",
    "Integration",
    "IntegrationProvider",
    "IntegrationStatus",
    "IntegrationToken",
    "Activity",
]
