"""Unified Calendar business logic."""

import math
import uuid
from datetime import date, datetime, timezone
from typing import List, Optional, Tuple, Union

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.calendar_event import CalendarEvent, CalendarEventType
from app.schemas.calendar_event import (
    CalendarEventCreate,
    CalendarEventResponse,
    CalendarEventUpdate,
)


class CalendarService:
    """Service providing CRUD and schedule aggregation for Calendar events."""

    @staticmethod
    def _format_event_response(event: CalendarEvent) -> CalendarEventResponse:
        """Convert CalendarEvent model instance to CalendarEventResponse schema."""
        return CalendarEventResponse(
            id=event.id,
            title=event.title,
            description=event.description,
            event_type=event.event_type,
            start_time=event.start_time,
            end_time=event.end_time,
            all_day=event.all_day,
            location=event.location,
            source=event.source,
            external_id=event.external_id,
            created_at=event.created_at,
            updated_at=event.updated_at,
        )

    @classmethod
    def list_events(
        cls,
        db: Session,
        start_date: Optional[Union[datetime, date]] = None,
        end_date: Optional[Union[datetime, date]] = None,
        event_type: Optional[CalendarEventType] = None,
        source: Optional[str] = None,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[CalendarEventResponse], int, int]:
        """List calendar events within an optional date/time range and type filter."""
        query = db.query(CalendarEvent).filter(
            CalendarEvent.deleted_at.is_(None),
        )

        if start_date is not None:
            if isinstance(start_date, date) and not isinstance(start_date, datetime):
                start_dt = datetime.combine(start_date, datetime.min.time()).replace(tzinfo=timezone.utc)
            else:
                start_dt = start_date
            query = query.filter(CalendarEvent.start_time >= start_dt)

        if end_date is not None:
            if isinstance(end_date, date) and not isinstance(end_date, datetime):
                end_dt = datetime.combine(end_date, datetime.max.time()).replace(tzinfo=timezone.utc)
            else:
                end_dt = end_date
            query = query.filter(CalendarEvent.start_time <= end_dt)

        if event_type is not None:
            query = query.filter(CalendarEvent.event_type == event_type)
        if source:
            query = query.filter(CalendarEvent.source == source)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        events = query.order_by(CalendarEvent.start_time.asc()).offset(offset).limit(per_page).all()

        formatted_events = [cls._format_event_response(e) for e in events]
        return formatted_events, total, total_pages

    @classmethod
    def create_event(cls, db: Session, data: CalendarEventCreate) -> CalendarEventResponse:
        """Create a new calendar event."""
        event_data = data.model_dump()
        event = CalendarEvent(**event_data)
        db.add(event)
        db.commit()
        db.refresh(event)
        return cls._format_event_response(event)

    @classmethod
    def get_event(cls, db: Session, event_id: uuid.UUID) -> CalendarEvent:
        """Retrieve calendar event by ID enforcing soft deletion check."""
        event = (
            db.query(CalendarEvent)
            .filter(
                CalendarEvent.id == event_id,
                CalendarEvent.deleted_at.is_(None),
            )
            .first()
        )
        if not event:
            raise NotFoundException(message="Calendar event not found", code="CALENDAR_EVENT_NOT_FOUND")
        return event

    @classmethod
    def get_event_response(cls, db: Session, event_id: uuid.UUID) -> CalendarEventResponse:
        """Retrieve calendar event and return formatted CalendarEventResponse."""
        event = cls.get_event(db, event_id)
        return cls._format_event_response(event)

    @classmethod
    def update_event(cls, db: Session, event_id: uuid.UUID, data: CalendarEventUpdate) -> CalendarEventResponse:
        """Update fields of an existing calendar event."""
        event = cls.get_event(db, event_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(event, field, value)

        db.commit()
        db.refresh(event)
        return cls._format_event_response(event)

    @classmethod
    def delete_event(cls, db: Session, event_id: uuid.UUID) -> None:
        """Soft delete a calendar event."""
        event = cls.get_event(db, event_id)
        event.deleted_at = datetime.now(timezone.utc)
        db.commit()


calendar_service = CalendarService()
