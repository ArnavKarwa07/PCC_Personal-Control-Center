"""Business logic for Notification dispatch and read state tracking."""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.notification import (
    Notification,
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationType,
)
from app.schemas.notification import NotificationCreate, NotificationResponse


class NotificationService:
    """Service managing in-app notifications, delivery state, and bulk read operations."""

    @staticmethod
    def _format_notification_response(notification: Notification) -> NotificationResponse:
        """Convert a Notification model instance into a NotificationResponse."""
        return NotificationResponse(
            id=notification.id,
            user_id=notification.user_id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            channel=notification.channel,
            status=notification.status,
            entity_type=notification.entity_type,
            entity_id=notification.entity_id,
            sent_at=notification.sent_at,
            read_at=notification.read_at,
            created_at=notification.created_at,
            updated_at=notification.updated_at,
            deleted_at=notification.deleted_at,
        )

    @classmethod
    def list_notifications(
        cls,
        db: Session,
        user_id: uuid.UUID,
        status: Optional[NotificationDeliveryStatus] = None,
        type: Optional[NotificationType] = None,
        channel: Optional[NotificationChannel] = None,
        unread_only: bool = False,
        page: int = 1,
        per_page: int = 50,
    ) -> Tuple[List[NotificationResponse], int, int]:
        """List notifications for the user with optional unread filter and pagination."""
        query = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.deleted_at.is_(None),
        )

        if unread_only:
            query = query.filter(Notification.status != NotificationDeliveryStatus.READ)
        elif status is not None:
            query = query.filter(Notification.status == status)

        if type is not None:
            query = query.filter(Notification.type == type)
        if channel is not None:
            query = query.filter(Notification.channel == channel)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        notifications = (
            query.order_by(Notification.created_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )

        formatted = [cls._format_notification_response(n) for n in notifications]
        return formatted, total, total_pages

    @classmethod
    def create_notification(
        cls,
        db: Session,
        user_id: uuid.UUID,
        data: NotificationCreate,
    ) -> NotificationResponse:
        """Create and persist a new notification record."""
        now = datetime.now(timezone.utc)
        notification = Notification(
            user_id=user_id,
            title=data.title,
            message=data.message,
            type=data.type,
            channel=data.channel,
            status=NotificationDeliveryStatus.PENDING,
            entity_type=data.entity_type,
            entity_id=data.entity_id,
            sent_at=now,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return cls._format_notification_response(notification)

    @classmethod
    def get_notification(
        cls,
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> Notification:
        """Retrieve notification enforcing user isolation and soft delete."""
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == user_id,
                Notification.deleted_at.is_(None),
            )
            .first()
        )
        if not notification:
            raise NotFoundException(message="Notification not found", code="NOTIFICATION_NOT_FOUND")
        return notification

    @classmethod
    def get_notification_response(
        cls,
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> NotificationResponse:
        """Retrieve single notification and format as response."""
        notification = cls.get_notification(db, user_id, notification_id)
        return cls._format_notification_response(notification)

    @classmethod
    def mark_as_read(
        cls,
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> NotificationResponse:
        """Mark a single notification as read."""
        notification = cls.get_notification(db, user_id, notification_id)
        notification.status = NotificationDeliveryStatus.READ
        notification.read_at = datetime.now(timezone.utc)

        db.commit()
        db.refresh(notification)
        return cls._format_notification_response(notification)

    @classmethod
    def mark_all_as_read(
        cls,
        db: Session,
        user_id: uuid.UUID,
    ) -> int:
        """Mark all unread notifications as read for the user."""
        now = datetime.now(timezone.utc)
        unread_notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == user_id,
                Notification.status != NotificationDeliveryStatus.READ,
                Notification.deleted_at.is_(None),
            )
            .all()
        )

        for notif in unread_notifications:
            notif.status = NotificationDeliveryStatus.READ
            notif.read_at = now

        db.commit()
        return len(unread_notifications)

    @classmethod
    def delete_notification(
        cls,
        db: Session,
        user_id: uuid.UUID,
        notification_id: uuid.UUID,
    ) -> None:
        """Soft delete a notification."""
        notification = cls.get_notification(db, user_id, notification_id)
        notification.deleted_at = datetime.now(timezone.utc)
        db.commit()


notification_service = NotificationService()
