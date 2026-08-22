"""API v1 master router aggregating all sub-routers."""

from fastapi import APIRouter

from app.api.v1.alarms import router as alarms_router
from app.api.v1.assistant import router as assistant_router
from app.api.v1.boards import router as boards_router
from app.api.v1.calendar import router as calendar_router
from app.api.v1.contacts import router as contacts_router
from app.api.v1.goals import router as goals_router
from app.api.v1.health import router as health_router
from app.api.v1.ideas import router as ideas_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.notes import router as notes_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.projects import router as projects_router
from app.api.v1.reminders import router as reminders_router
from app.api.v1.search import router as search_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.timers import router as timers_router
from app.api.v1.weather import router as weather_router

api_v1_router = APIRouter()

api_v1_router.include_router(health_router)
api_v1_router.include_router(tasks_router)
api_v1_router.include_router(projects_router)
api_v1_router.include_router(boards_router)
api_v1_router.include_router(notes_router)
api_v1_router.include_router(ideas_router)
api_v1_router.include_router(calendar_router)
api_v1_router.include_router(reminders_router)
api_v1_router.include_router(alarms_router)
api_v1_router.include_router(timers_router)
api_v1_router.include_router(notifications_router)
api_v1_router.include_router(integrations_router)
api_v1_router.include_router(weather_router)
api_v1_router.include_router(contacts_router)
api_v1_router.include_router(goals_router)
api_v1_router.include_router(assistant_router)
api_v1_router.include_router(search_router)

