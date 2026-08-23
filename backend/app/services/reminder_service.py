"""Business logic for Reminder management and scheduling."""

import math
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.reminder import Reminder, ReminderStatus
from app.schemas.reminder import ReminderCreate, ReminderResponse, ReminderUpdate


class ReminderService:
    """Service providing CRUD and snooze operations for scheduled reminders."""

    @staticmethod
    def _format_reminder_response(reminder: Reminder) -> ReminderResponse:
        """Convert a Reminder model instance into a ReminderResponse."""
        return ReminderResponse(
            id=reminder.id,
            title=reminder.title,
            description=reminder.description,
            remind_at=reminder.remind_at,
            is_recurring=reminder.is_recurring,
            status=reminder.status,
            snoozed_until=reminder.snoozed_until,
            created_at=reminder.created_at,
            updated_at=reminder.updated_at,
            deleted_at=reminder.deleted_at,
        )

    @classmethod
    def list_reminders(
        cls,
        db: Session,
        status: Optional[ReminderStatus] = None,
        is_recurring: Optional[bool] = None,
        remind_before: Optional[datetime] = None,
        remind_after: Optional[datetime] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[ReminderResponse], int, int]:
        """List reminders with pagination and filters."""
        query = db.query(Reminder).filter(
            Reminder.deleted_at.is_(None),
        )

        if status is not None:
            query = query.filter(Reminder.status == status)
        if is_recurring is not None:
            query = query.filter(Reminder.is_recurring == is_recurring)
        if remind_before is not None:
            query = query.filter(Reminder.remind_at <= remind_before)
        if remind_after is not None:
            query = query.filter(Reminder.remind_at >= remind_after)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        reminders = (
            query.order_by(Reminder.remind_at.asc(), Reminder.created_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )

        formatted = [cls._format_reminder_response(r) for r in reminders]
        return formatted, total, total_pages

    @classmethod
    def create_reminder(
        cls,
        db: Session,
        data: ReminderCreate,
    ) -> ReminderResponse:
        """Create a new reminder."""
        reminder = Reminder(
            title=data.title,
            description=data.description,
            remind_at=data.remind_at,
            is_recurring=data.is_recurring,
            status=ReminderStatus.PENDING,
        )
        db.add(reminder)
        db.commit()
        db.refresh(reminder)
        return cls._format_reminder_response(reminder)

    @classmethod
    def get_reminder(
        cls,
        db: Session,
        reminder_id: uuid.UUID,
    ) -> Reminder:
        """Retrieve reminder model enforcing soft delete check."""
        reminder = (
            db.query(Reminder)
            .filter(
                Reminder.id == reminder_id,
                Reminder.deleted_at.is_(None),
            )
            .first()
        )
        if not reminder:
            raise NotFoundException(message="Reminder not found", code="REMINDER_NOT_FOUND")
        return reminder

    @classmethod
    def get_reminder_response(
        cls,
        db: Session,
        reminder_id: uuid.UUID,
    ) -> ReminderResponse:
        """Retrieve single reminder and format as response."""
        reminder = cls.get_reminder(db, reminder_id)
        return cls._format_reminder_response(reminder)

    @classmethod
    def update_reminder(
        cls,
        db: Session,
        reminder_id: uuid.UUID,
        data: ReminderUpdate,
    ) -> ReminderResponse:
        """Update reminder fields."""
        reminder = cls.get_reminder(db, reminder_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(reminder, field, value)

        db.commit()
        db.refresh(reminder)
        return cls._format_reminder_response(reminder)

    @classmethod
    def snooze_reminder(
        cls,
        db: Session,
        reminder_id: uuid.UUID,
        snooze_minutes: Optional[int] = 10,
        snooze_until: Optional[datetime] = None,
    ) -> ReminderResponse:
        """Snooze a reminder by a duration or until a specified target timestamp."""
        reminder = cls.get_reminder(db, reminder_id)

        now = datetime.now(timezone.utc)
        if snooze_until:
            target_time = snooze_until
        else:
            minutes = snooze_minutes if snooze_minutes and snooze_minutes > 0 else 10
            target_time = now + timedelta(minutes=minutes)

        reminder.status = ReminderStatus.SNOOZED
        reminder.snoozed_until = target_time

        db.commit()
        db.refresh(reminder)
        return cls._format_reminder_response(reminder)

    @classmethod
    def delete_reminder(
        cls,
        db: Session,
        reminder_id: uuid.UUID,
    ) -> None:
        """Soft delete a reminder by setting deleted_at timestamp."""
        reminder = cls.get_reminder(db, reminder_id)
        reminder.deleted_at = datetime.now(timezone.utc)
        db.commit()


reminder_service = ReminderService()
