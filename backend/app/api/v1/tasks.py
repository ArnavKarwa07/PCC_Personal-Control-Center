"""Task management REST API endpoints."""

import uuid
from datetime import date
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.task import TaskPriority, TaskStatus
from app.models.user import User
from app.schemas.task import TaskCreate, TaskUpdate
from app.services.task_service import task_service

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("/list_tasks", operation_id="list_tasks", summary="List Tasks")
def list_tasks(
    status: Optional[TaskStatus] = None,
    priority: Optional[TaskPriority] = None,
    project_id: Optional[uuid.UUID] = None,
    due_before: Optional[date] = None,
    due_after: Optional[date] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated tasks for authenticated user with multi-criteria filters."""
    tasks, total, total_pages = task_service.list_tasks(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        status=status,
        priority=priority,
        project_id=project_id,
        due_before=due_before,
        due_after=due_after,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [t.model_dump() for t in tasks],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("/create_task", operation_id="create_task", status_code=status.HTTP_201_CREATED, summary="Create Task")
def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new task under authenticated user account."""
    task = task_service.create_task(db=db, user_id=settings.DEFAULT_OWNER_ID, data=data)
    return {
        "data": task.model_dump(),
    }


@router.get("/get_task_by_id/{task_id}", operation_id="get_task_by_id", summary="Get Task By Id")
def get_task_by_id(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get single task by UUID enforcing user ownership."""
    task = task_service.get_task_response(db=db, user_id=settings.DEFAULT_OWNER_ID, task_id=task_id)
    return {
        "data": task.model_dump(),
    }


@router.patch("/update_task_by_id/{task_id}", operation_id="update_task_by_id", summary="Update Task By Id")
def update_task_by_id(
    task_id: uuid.UUID,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update task details for authenticated user."""
    task = task_service.update_task(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        task_id=task_id,
        data=data,
    )
    return {
        "data": task.model_dump(),
    }


@router.delete("/delete_task_by_id/{task_id}", operation_id="delete_task_by_id", summary="Delete Task By Id")
def delete_task_by_id(
    task_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a task."""
    task_service.delete_task(db=db, user_id=settings.DEFAULT_OWNER_ID, task_id=task_id)
    return {
        "data": {
            "message": "Task deleted successfully.",
        }
    }
