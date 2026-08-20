"""Unified Calendar REST API endpoints."""

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.calendar_event import CalendarEventType
from app.models.user import User
from app.schemas.calendar_event import CalendarEventCreate, CalendarEventUpdate
from app.services.calendar_service import calendar_service

router = APIRouter(prefix="/calendar", tags=["Calendar"])


@router.get("/events/list_calendar_events", operation_id="list_calendar_events", summary="List Calendar Events")
def list_calendar_events(
    start_date: Optional[datetime] = Query(None, description="Filter events starting on or after this timestamp"),
    end_date: Optional[datetime] = Query(None, description="Filter events starting on or before this timestamp"),
    event_type: Optional[CalendarEventType] = None,
    source: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve calendar events within a date range with optional type and source filtering."""
    events, total, total_pages = calendar_service.list_events(
        db=db,
        user_id=current_user.id,
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
        source=source,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [e.model_dump() for e in events],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("/events/create_calendar_event", operation_id="create_calendar_event", status_code=status.HTTP_201_CREATED, summary="Create Calendar Event")
def create_calendar_event(
    data: CalendarEventCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new calendar event for the authenticated user."""
    event = calendar_service.create_event(db=db, user_id=current_user.id, data=data)
    return {
        "data": event.model_dump(),
    }


@router.get("/events/get_calendar_event_by_id/{event_id}", operation_id="get_calendar_event_by_id", summary="Get Calendar Event By Id")
def get_calendar_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single calendar event by ID."""
    event = calendar_service.get_event_response(db=db, user_id=current_user.id, event_id=event_id)
    return {
        "data": event.model_dump(),
    }


@router.patch("/events/update_calendar_event_by_id/{event_id}", operation_id="update_calendar_event_by_id", summary="Update Calendar Event By Id")
def update_calendar_event(
    event_id: uuid.UUID,
    data: CalendarEventUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update calendar event details."""
    event = calendar_service.update_event(
        db=db,
        user_id=current_user.id,
        event_id=event_id,
        data=data,
    )
    return {
        "data": event.model_dump(),
    }


@router.delete("/events/delete_calendar_event_by_id/{event_id}", operation_id="delete_calendar_event_by_id", summary="Delete Calendar Event By Id")
def delete_calendar_event(
    event_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a calendar event."""
    calendar_service.delete_event(db=db, user_id=current_user.id, event_id=event_id)
    return {
        "data": {
            "message": "Calendar event deleted successfully.",
        }
    }
