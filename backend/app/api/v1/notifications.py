"""Unified Notifications REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.notification import (
    NotificationChannel,
    NotificationDeliveryStatus,
    NotificationType,
)
from app.models.user import User
from app.services.notification_service import notification_service

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", operation_id="listNotifications")
def list_notifications(
    status: Optional[NotificationDeliveryStatus] = None,
    type: Optional[NotificationType] = None,
    channel: Optional[NotificationChannel] = None,
    unread_only: bool = Query(False, description="Filter for unread notifications only"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(50, ge=1, le=200, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve in-app notifications for the authenticated user."""
    notifications, total, total_pages = notification_service.list_notifications(
        db=db,
        user_id=current_user.id,
        status=status,
        type=type,
        channel=channel,
        unread_only=unread_only,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [n.model_dump() for n in notifications],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.patch("/{notification_id}/read", operation_id="markNotificationAsRead")
def mark_notification_read(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a specific notification as read."""
    notification = notification_service.mark_as_read(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
    return {
        "data": notification.model_dump(),
    }


@router.patch("/read-all", operation_id="markAllNotificationsAsRead")
def mark_all_notifications_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark all pending or sent notifications as read."""
    count = notification_service.mark_all_as_read(
        db=db,
        user_id=current_user.id,
    )
    return {
        "data": {
            "message": f"Successfully marked {count} notifications as read.",
            "count": count,
        }
    }


@router.delete("/{notification_id}", operation_id="deleteNotificationById")
def delete_notification(
    notification_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a notification."""
    notification_service.delete_notification(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )
    return {
        "data": {
            "message": "Notification deleted successfully.",
        }
    }
