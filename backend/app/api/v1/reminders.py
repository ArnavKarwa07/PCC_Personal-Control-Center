"""Unified Reminders REST API endpoints."""

from app.core.config import settings
import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.reminder import ReminderStatus
from app.models.user import User
from app.schemas.reminder import (
    ReminderCreate,
    ReminderSnoozeRequest,
    ReminderUpdate,
)
from app.services.reminder_service import reminder_service

router = APIRouter(prefix="/reminders", tags=["Reminders"])


@router.get("/list_reminders", operation_id="list_reminders", summary="List Reminders")
def list_reminders(
    status: Optional[ReminderStatus] = None,
    is_recurring: Optional[bool] = None,
    remind_before: Optional[datetime] = Query(None, description="Filter reminders scheduled on or before timestamp"),
    remind_after: Optional[datetime] = Query(None, description="Filter reminders scheduled on or after timestamp"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all reminders for the authenticated user."""
    reminders, total, total_pages = reminder_service.list_reminders(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        status=status,
        is_recurring=is_recurring,
        remind_before=remind_before,
        remind_after=remind_after,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [r.model_dump() for r in reminders],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("/create_reminder", operation_id="create_reminder", status_code=status.HTTP_201_CREATED, summary="Create Reminder")
def create_reminder(
    data: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new reminder scheduled for alerting."""
    reminder = reminder_service.create_reminder(db=db, user_id=settings.DEFAULT_OWNER_ID, data=data)
    return {
        "data": reminder.model_dump(),
    }


@router.get("/get_reminder_by_id/{reminder_id}", operation_id="get_reminder_by_id", summary="Get Reminder By Id")
def get_reminder(
    reminder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single reminder by ID."""
    reminder = reminder_service.get_reminder_response(db=db, user_id=settings.DEFAULT_OWNER_ID, reminder_id=reminder_id)
    return {
        "data": reminder.model_dump(),
    }


@router.patch("/update_reminder_by_id/{reminder_id}", operation_id="update_reminder_by_id", summary="Update Reminder By Id")
def update_reminder(
    reminder_id: uuid.UUID,
    data: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update reminder configuration and scheduled trigger time."""
    reminder = reminder_service.update_reminder(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        reminder_id=reminder_id,
        data=data,
    )
    return {
        "data": reminder.model_dump(),
    }


@router.post("/snooze_reminder_by_id/{reminder_id}", operation_id="snooze_reminder_by_id", summary="Snooze Reminder By Id")
def snooze_reminder(
    reminder_id: uuid.UUID,
    data: Optional[ReminderSnoozeRequest] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Snooze an alert for a specified duration or timestamp."""
    snooze_minutes = data.snooze_minutes if data else 10
    snooze_until = data.snooze_until if data else None
    reminder = reminder_service.snooze_reminder(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        reminder_id=reminder_id,
        snooze_minutes=snooze_minutes,
        snooze_until=snooze_until,
    )
    return {
        "data": reminder.model_dump(),
    }


@router.delete("/delete_reminder_by_id/{reminder_id}", operation_id="delete_reminder_by_id", summary="Delete Reminder By Id")
def delete_reminder(
    reminder_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a reminder."""
    reminder_service.delete_reminder(db=db, user_id=settings.DEFAULT_OWNER_ID, reminder_id=reminder_id)
    return {
        "data": {
            "message": "Reminder deleted successfully.",
        }
    }
