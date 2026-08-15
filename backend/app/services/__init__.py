"""Business services module."""

from app.services.alarm_service import AlarmService, alarm_service
from app.services.auth_service import AuthService, auth_service
from app.services.calendar_service import CalendarService, calendar_service
from app.services.idea_service import IdeaService, idea_service
from app.services.integration_service import (
    GitHubConnector,
    GoogleCalendarConnector,
    IntegrationService,
    WeatherConnector,
    integration_service,
)
from app.services.note_service import NoteService, note_service
from app.services.notification_service import NotificationService, notification_service
from app.services.project_service import ProjectService, project_service
from app.services.reminder_service import ReminderService, reminder_service
from app.services.task_service import TaskService, task_service
from app.services.timer_service import TimerService, timer_service
from app.services.weather_service import WeatherService, weather_service

__all__ = [
    "AuthService",
    "auth_service",
    "TaskService",
    "task_service",
    "ProjectService",
    "project_service",
    "NoteService",
    "note_service",
    "IdeaService",
    "idea_service",
    "CalendarService",
    "calendar_service",
    "ReminderService",
    "reminder_service",
    "AlarmService",
    "alarm_service",
    "TimerService",
    "timer_service",
    "NotificationService",
    "notification_service",
    "IntegrationService",
    "integration_service",
    "GitHubConnector",
    "GoogleCalendarConnector",
    "WeatherConnector",
    "WeatherService",
    "weather_service",
]
