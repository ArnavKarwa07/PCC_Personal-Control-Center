"""Project management REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.project import ProjectPriority, ProjectStatus
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectMemberCreate,
    ProjectUpdate,
)
from app.services.project_service import project_service

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", summary="List Projects")
def list_projects(
    status: Optional[ProjectStatus] = None,
    priority: Optional[ProjectPriority] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated projects for authenticated user."""
    projects, total, total_pages = project_service.list_projects(
        db=db,
        user_id=current_user.id,
        status=status,
        priority=priority,
        search=search,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [p.model_dump() for p in projects],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Project")
def create_project(
    data: ProjectCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new project with default Kanban board."""
    project = project_service.create_project(db=db, user_id=current_user.id, data=data)
    return {
        "data": project.model_dump(),
    }


@router.get("/{project_id}")
def get_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve single project by ID."""
    project = project_service.get_project_response(db=db, user_id=current_user.id, project_id=project_id)
    return {
        "data": project.model_dump(),
    }


@router.patch("/{project_id}")
def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update project details."""
    project = project_service.update_project(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        data=data,
    )
    return {
        "data": project.model_dump(),
    }


@router.delete("/{project_id}")
def delete_project(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a project."""
    project_service.delete_project(db=db, user_id=current_user.id, project_id=project_id)
    return {
        "data": {
            "message": "Project deleted successfully.",
        }
    }


@router.get("/{project_id}/board")
def get_project_board(
    project_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the Kanban board, columns, and cards for a project."""
    board = project_service.get_project_board(db=db, user_id=current_user.id, project_id=project_id)
    return {
        "data": board.model_dump(),
    }


@router.post("/{project_id}/members", status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: uuid.UUID,
    data: ProjectMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Assign a contact as a member of the project."""
    member = project_service.add_project_member(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        data=data,
    )
    return {
        "data": member.model_dump(),
    }


@router.delete("/{project_id}/members/{member_id}")
def remove_project_member(
    project_id: uuid.UUID,
    member_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Remove a member from the project."""
    project_service.remove_project_member(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        member_id=member_id,
    )
    return {
        "data": {
            "message": "Project member removed successfully.",
        }
    }
