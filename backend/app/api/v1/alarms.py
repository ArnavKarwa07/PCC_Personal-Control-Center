"""Unified Alarms REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.alarm import (
    AlarmCreate,
    AlarmToggleRequest,
    AlarmUpdate,
)
from app.services.alarm_service import alarm_service

router = APIRouter(prefix="/alarms", tags=["Alarms"])


@router.get("/list_alarms", operation_id="list_alarms", summary="List Alarms")
def list_alarms(
    is_enabled: Optional[bool] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    db: Session = Depends(get_db),
):
    """Retrieve all configured alarms."""
    alarms, total, total_pages = alarm_service.list_alarms(
        db=db,
        is_enabled=is_enabled,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [a.model_dump() for a in alarms],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("/create_alarm", operation_id="create_alarm", status_code=status.HTTP_201_CREATED, summary="Create Alarm")
def create_alarm(
    data: AlarmCreate,
    db: Session = Depends(get_db),
):
    """Create a new wake/trigger alarm."""
    alarm = alarm_service.create_alarm(db=db, data=data)
    return {
        "data": alarm.model_dump(),
    }


@router.get("/get_alarm_by_id/{alarm_id}", operation_id="get_alarm_by_id", summary="Get Alarm By Id")
def get_alarm(
    alarm_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Get a single alarm by ID."""
    alarm = alarm_service.get_alarm_response(db=db, alarm_id=alarm_id)
    return {
        "data": alarm.model_dump(),
    }


@router.patch("/update_alarm_by_id/{alarm_id}", operation_id="update_alarm_by_id", summary="Update Alarm By Id")
def update_alarm(
    alarm_id: uuid.UUID,
    data: AlarmUpdate,
    db: Session = Depends(get_db),
):
    """Update alarm properties."""
    alarm = alarm_service.update_alarm(
        db=db,
        alarm_id=alarm_id,
        data=data,
    )
    return {
        "data": alarm.model_dump(),
    }


@router.patch("/toggle_alarm_by_id/{alarm_id}", operation_id="toggle_alarm_by_id", summary="Toggle Alarm By Id")
def toggle_alarm(
    alarm_id: uuid.UUID,
    data: Optional[AlarmToggleRequest] = None,
    db: Session = Depends(get_db),
):
    """Toggle alarm armed state (enabled/disabled)."""
    is_enabled = data.is_enabled if data else None
    alarm = alarm_service.toggle_alarm(
        db=db,
        alarm_id=alarm_id,
        is_enabled=is_enabled,
    )
    return {
        "data": alarm.model_dump(),
    }


@router.delete("/delete_alarm_by_id/{alarm_id}", operation_id="delete_alarm_by_id", summary="Delete Alarm By Id")
def delete_alarm(
    alarm_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Soft delete an alarm."""
    alarm_service.delete_alarm(db=db, alarm_id=alarm_id)
    return {
        "data": {
            "message": "Alarm deleted successfully.",
        }
    }
