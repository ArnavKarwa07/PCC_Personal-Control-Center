"""Business logic for Timer management and state machine."""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import BadRequestException, NotFoundException
from app.models.timer import TimerModel, TimerState, TimerType
from app.schemas.timer import TimerCreate, TimerResponse, TimerUpdate


class TimerService:
    """Service providing CRUD and state transitions for user focus and countdown timers."""

    @staticmethod
    def _format_timer_response(timer: TimerModel) -> TimerResponse:
        """Convert a TimerModel instance into a TimerResponse."""
        return TimerResponse(
            id=timer.id,
            label=timer.label,
            timer_type=timer.timer_type,
            duration_seconds=timer.duration_seconds,
            remaining_seconds=timer.remaining_seconds,
            status=timer.status,
            started_at=timer.started_at,
            preset_name=timer.preset_name,
            created_at=timer.created_at,
            updated_at=timer.updated_at,
            deleted_at=timer.deleted_at,
        )

    @classmethod
    def list_timers(
        cls,
        db: Session,
        status: Optional[TimerState] = None,
        timer_type: Optional[TimerType] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[TimerResponse], int, int]:
        """List timers with pagination and filters."""
        query = db.query(TimerModel).filter(
            TimerModel.deleted_at.is_(None),
        )

        if status is not None:
            query = query.filter(TimerModel.status == status)
        if timer_type is not None:
            query = query.filter(TimerModel.timer_type == timer_type)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        timers = query.order_by(TimerModel.created_at.desc()).offset(offset).limit(per_page).all()

        formatted = [cls._format_timer_response(t) for t in timers]
        return formatted, total, total_pages

    @classmethod
    def create_timer(
        cls,
        db: Session,
        data: TimerCreate,
    ) -> TimerResponse:
        """Create a new timer instance."""
        initial_remaining = data.remaining_seconds if data.remaining_seconds is not None else data.duration_seconds

        timer = TimerModel(
            label=data.label,
            timer_type=data.timer_type,
            duration_seconds=data.duration_seconds,
            remaining_seconds=initial_remaining,
            status=TimerState.IDLE,
            preset_name=data.preset_name,
        )
        db.add(timer)
        db.commit()
        db.refresh(timer)
        return cls._format_timer_response(timer)

    @classmethod
    def get_timer(
        cls,
        db: Session,
        timer_id: uuid.UUID,
    ) -> TimerModel:
        """Retrieve timer model enforcing soft delete."""
        timer = (
            db.query(TimerModel)
            .filter(
                TimerModel.id == timer_id,
                TimerModel.deleted_at.is_(None),
            )
            .first()
        )
        if not timer:
            raise NotFoundException(message="Timer not found", code="TIMER_NOT_FOUND")
        return timer

    @classmethod
    def get_timer_response(
        cls,
        db: Session,
        timer_id: uuid.UUID,
    ) -> TimerResponse:
        """Retrieve single timer and format as response."""
        timer = cls.get_timer(db, timer_id)
        return cls._format_timer_response(timer)

    @classmethod
    def update_timer(
        cls,
        db: Session,
        timer_id: uuid.UUID,
        data: TimerUpdate,
    ) -> TimerResponse:
        """Update timer configuration."""
        timer = cls.get_timer(db, timer_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(timer, field, value)

        db.commit()
        db.refresh(timer)
        return cls._format_timer_response(timer)

    @classmethod
    def update_timer_state(
        cls,
        db: Session,
        timer_id: uuid.UUID,
        action: str,
        remaining_seconds: Optional[int] = None,
    ) -> TimerResponse:
        """Transition timer state: start, pause, reset, complete."""
        timer = cls.get_timer(db, timer_id)
        action_clean = action.strip().lower()

        now = datetime.now(timezone.utc)

        if action_clean == "start":
            timer.status = TimerState.RUNNING
            timer.started_at = now
            if remaining_seconds is not None:
                timer.remaining_seconds = remaining_seconds
            elif timer.remaining_seconds is None and timer.duration_seconds is not None:
                timer.remaining_seconds = timer.duration_seconds

        elif action_clean == "pause":
            timer.status = TimerState.PAUSED
            if remaining_seconds is not None:
                timer.remaining_seconds = remaining_seconds

        elif action_clean == "reset":
            timer.status = TimerState.IDLE
            timer.started_at = None
            timer.remaining_seconds = timer.duration_seconds

        elif action_clean == "complete":
            timer.status = TimerState.COMPLETED
            timer.remaining_seconds = 0

        else:
            raise BadRequestException(
                message=f"Invalid action '{action}'. Allowed actions: start, pause, reset, complete",
                code="INVALID_TIMER_ACTION",
            )

        db.commit()
        db.refresh(timer)
        return cls._format_timer_response(timer)

    @classmethod
    def delete_timer(
        cls,
        db: Session,
        timer_id: uuid.UUID,
    ) -> None:
        """Soft delete a timer."""
        timer = cls.get_timer(db, timer_id)
        timer.deleted_at = datetime.now(timezone.utc)
        db.commit()


timer_service = TimerService()
