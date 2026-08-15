"""Idea management and promotion REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.idea import IdeaStatus
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaPromoteRequest, IdeaUpdate
from app.services.idea_service import idea_service

router = APIRouter(prefix="/ideas", tags=["Ideas"])


@router.get("", summary="List Ideas")
def list_ideas(
    status: Optional[IdeaStatus] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated ideas for authenticated user."""
    ideas, total, total_pages = idea_service.list_ideas(
        db=db,
        user_id=current_user.id,
        status=status,
        category=category,
        search=search,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [i.model_dump() for i in ideas],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Idea")
def create_idea(
    data: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Capture a new idea under authenticated user."""
    idea = idea_service.create_idea(db=db, user_id=current_user.id, data=data)
    return {
        "data": idea.model_dump(),
    }


@router.get("/{idea_id}")
def get_idea(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single idea by ID."""
    idea = idea_service.get_idea_response(db=db, user_id=current_user.id, idea_id=idea_id)
    return {
        "data": idea.model_dump(),
    }


@router.patch("/{idea_id}")
def update_idea(
    idea_id: uuid.UUID,
    data: IdeaUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update idea details."""
    idea = idea_service.update_idea(
        db=db,
        user_id=current_user.id,
        idea_id=idea_id,
        data=data,
    )
    return {
        "data": idea.model_dump(),
    }


@router.post("/{idea_id}/promote")
def promote_idea(
    idea_id: uuid.UUID,
    data: IdeaPromoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Promote an idea into a Project or Task."""
    idea, created_entity = idea_service.promote_idea(
        db=db,
        user_id=current_user.id,
        idea_id=idea_id,
        data=data,
    )
    return {
        "data": {
            "idea": idea.model_dump(),
            "promoted_entity": created_entity,
        }
    }


@router.delete("/{idea_id}")
def delete_idea(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete an idea."""
    idea_service.delete_idea(db=db, user_id=current_user.id, idea_id=idea_id)
    return {
        "data": {
            "message": "Idea deleted successfully.",
        }
    }
