"""Business logic for Alarm management."""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.alarm import Alarm
from app.schemas.alarm import AlarmCreate, AlarmResponse, AlarmUpdate


class AlarmService:
    """Service providing CRUD and state toggle operations for user alarms."""

    @staticmethod
    def _format_alarm_response(alarm: Alarm) -> AlarmResponse:
        """Convert an Alarm model instance into an AlarmResponse."""
        return AlarmResponse(
            id=alarm.id,
            user_id=alarm.user_id,
            label=alarm.label,
            time=alarm.time,
            days_of_week=alarm.days_of_week,
            is_recurring=alarm.is_recurring,
            is_enabled=alarm.is_enabled,
            created_at=alarm.created_at,
            updated_at=alarm.updated_at,
            deleted_at=alarm.deleted_at,
        )

    @classmethod
    def list_alarms(
        cls,
        db: Session,
        user_id: uuid.UUID,
        is_enabled: Optional[bool] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[AlarmResponse], int, int]:
        """List alarms for the authenticated user with pagination and filters."""
        query = db.query(Alarm).filter(
            Alarm.user_id == user_id,
            Alarm.deleted_at.is_(None),
        )

        if is_enabled is not None:
            query = query.filter(Alarm.is_enabled == is_enabled)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        alarms = (
            query.order_by(Alarm.time.asc(), Alarm.created_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )

        formatted = [cls._format_alarm_response(a) for a in alarms]
        return formatted, total, total_pages

    @classmethod
    def create_alarm(
        cls,
        db: Session,
        user_id: uuid.UUID,
        data: AlarmCreate,
    ) -> AlarmResponse:
        """Create a new alarm for the authenticated user."""
        alarm = Alarm(
            user_id=user_id,
            label=data.label,
            time=data.time,
            days_of_week=data.days_of_week,
            is_recurring=data.is_recurring,
            is_enabled=data.is_enabled,
        )
        db.add(alarm)
        db.commit()
        db.refresh(alarm)
        return cls._format_alarm_response(alarm)

    @classmethod
    def get_alarm(
        cls,
        db: Session,
        user_id: uuid.UUID,
        alarm_id: uuid.UUID,
    ) -> Alarm:
        """Retrieve alarm model enforcing user isolation and soft delete."""
        alarm = (
            db.query(Alarm)
            .filter(
                Alarm.id == alarm_id,
                Alarm.user_id == user_id,
                Alarm.deleted_at.is_(None),
            )
            .first()
        )
        if not alarm:
            raise NotFoundException(message="Alarm not found", code="ALARM_NOT_FOUND")
        return alarm

    @classmethod
    def get_alarm_response(
        cls,
        db: Session,
        user_id: uuid.UUID,
        alarm_id: uuid.UUID,
    ) -> AlarmResponse:
        """Retrieve single alarm and format as response."""
        alarm = cls.get_alarm(db, user_id, alarm_id)
        return cls._format_alarm_response(alarm)

    @classmethod
    def update_alarm(
        cls,
        db: Session,
        user_id: uuid.UUID,
        alarm_id: uuid.UUID,
        data: AlarmUpdate,
    ) -> AlarmResponse:
        """Update alarm properties."""
        alarm = cls.get_alarm(db, user_id, alarm_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(alarm, field, value)

        db.commit()
        db.refresh(alarm)
        return cls._format_alarm_response(alarm)

    @classmethod
    def toggle_alarm(
        cls,
        db: Session,
        user_id: uuid.UUID,
        alarm_id: uuid.UUID,
        is_enabled: Optional[bool] = None,
    ) -> AlarmResponse:
        """Toggle alarm armed state."""
        alarm = cls.get_alarm(db, user_id, alarm_id)
        if is_enabled is not None:
            alarm.is_enabled = is_enabled
        else:
            alarm.is_enabled = not alarm.is_enabled

        db.commit()
        db.refresh(alarm)
        return cls._format_alarm_response(alarm)

    @classmethod
    def delete_alarm(
        cls,
        db: Session,
        user_id: uuid.UUID,
        alarm_id: uuid.UUID,
    ) -> None:
        """Soft delete an alarm."""
        alarm = cls.get_alarm(db, user_id, alarm_id)
        alarm.deleted_at = datetime.now(timezone.utc)
        db.commit()


alarm_service = AlarmService()
