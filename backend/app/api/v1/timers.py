"""Unified Timers REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.timer import TimerState, TimerType
from app.schemas.timer import (
    TimerCreate,
    TimerStateAction,
    TimerUpdate,
)
from app.services.timer_service import timer_service

router = APIRouter(prefix="/timers", tags=["Timers"])


@router.get("/list_timers", operation_id="list_timers", summary="List Timers")
def list_timers(
    status: Optional[TimerState] = None,
    timer_type: Optional[TimerType] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Retrieve all timers."""
    timers, total, total_pages = timer_service.list_timers(
        db=db,
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


@router.post("/create_timer", operation_id="create_timer", status_code=status.HTTP_201_CREATED, summary="Create Timer")
def create_timer(
    data: TimerCreate,
    db: Session = Depends(get_db),
):
    """Create a new countdown, stopwatch, or pomodoro timer."""
    timer = timer_service.create_timer(db=db, data=data)
    return {
        "data": timer.model_dump(),
    }


@router.get("/get_timer_by_id/{timer_id}", operation_id="get_timer_by_id", summary="Get Timer By Id")
def get_timer(
    timer_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get a single timer by ID."""
    timer = timer_service.get_timer_response(db=db, timer_id=timer_id)
    return {
        "data": timer.model_dump(),
    }


@router.patch("/update_timer_by_id/{timer_id}", operation_id="update_timer_by_id", summary="Update Timer By Id")
def update_timer(
    timer_id: uuid.UUID,
    data: TimerUpdate,
    db: Session = Depends(get_db),
):
    """Update timer configuration."""
    timer = timer_service.update_timer(
        db=db,
        timer_id=timer_id,
        data=data,
    )
    return {
        "data": timer.model_dump(),
    }


@router.patch("/update_timer_state_by_id/{timer_id}", operation_id="update_timer_state_by_id", summary="Update Timer State By Id")
def update_timer_state(
    timer_id: uuid.UUID,
    data: TimerStateAction,
    db: Session = Depends(get_db),
):
    """Trigger a state transition on the timer (start, pause, reset, complete)."""
    timer = timer_service.update_timer_state(
        db=db,
        timer_id=timer_id,
        action=data.action,
        remaining_seconds=data.remaining_seconds,
    )
    return {
        "data": timer.model_dump(),
    }


@router.delete("/delete_timer_by_id/{timer_id}", operation_id="delete_timer_by_id", summary="Delete Timer By Id")
def delete_timer(
    timer_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Soft delete a timer."""
    timer_service.delete_timer(db=db, timer_id=timer_id)
    return {
        "data": {
            "message": "Timer deleted successfully.",
        }
    }
