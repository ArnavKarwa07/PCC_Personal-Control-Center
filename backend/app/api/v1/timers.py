"""Unified Timers REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.timer import TimerState, TimerType
from app.models.user import User
from app.schemas.timer import (
    TimerCreate,
    TimerStateAction,
    TimerUpdate,
)
from app.services.timer_service import timer_service

router = APIRouter(prefix="/timers", tags=["Timers"])


@router.get("", operation_id="listTimers")
def list_timers(
    status: Optional[TimerState] = None,
    timer_type: Optional[TimerType] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve all timers for the authenticated user."""
    timers, total, total_pages = timer_service.list_timers(
        db=db,
        user_id=current_user.id,
        status=status,
        timer_type=timer_type,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [t.model_dump() for t in timers],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("", operation_id="createTimer", status_code=status.HTTP_201_CREATED)
def create_timer(
    data: TimerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new countdown, stopwatch, or pomodoro timer."""
    timer = timer_service.create_timer(db=db, user_id=current_user.id, data=data)
    return {
        "data": timer.model_dump(),
    }


@router.get("/{timer_id}", operation_id="getTimerById")
def get_timer(
    timer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single timer by ID."""
    timer = timer_service.get_timer_response(db=db, user_id=current_user.id, timer_id=timer_id)
    return {
        "data": timer.model_dump(),
    }


@router.patch("/{timer_id}", operation_id="updateTimerById")
def update_timer(
    timer_id: uuid.UUID,
    data: TimerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update timer configuration."""
    timer = timer_service.update_timer(
        db=db,
        user_id=current_user.id,
        timer_id=timer_id,
        data=data,
    )
    return {
        "data": timer.model_dump(),
    }


@router.patch("/{timer_id}/state", operation_id="updateTimerStateById")
def update_timer_state(
    timer_id: uuid.UUID,
    data: TimerStateAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Trigger a state transition on the timer (start, pause, reset, complete)."""
    timer = timer_service.update_timer_state(
        db=db,
        user_id=current_user.id,
        timer_id=timer_id,
        action=data.action,
        remaining_seconds=data.remaining_seconds,
    )
    return {
        "data": timer.model_dump(),
    }


@router.delete("/{timer_id}", operation_id="deleteTimerById")
def delete_timer(
    timer_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a timer."""
    timer_service.delete_timer(db=db, user_id=current_user.id, timer_id=timer_id)
    return {
        "data": {
            "message": "Timer deleted successfully.",
        }
    }
