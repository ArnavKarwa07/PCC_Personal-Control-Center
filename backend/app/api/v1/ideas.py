"""Idea management and promotion REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.idea import IdeaStatus
from app.models.user import User
from app.schemas.idea import IdeaCreate, IdeaPromoteRequest, IdeaUpdate
from app.services.idea_service import idea_service

router = APIRouter(prefix="/ideas", tags=["Ideas"])


@router.get("/list_ideas", operation_id="list_ideas", summary="List Ideas")
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
        user_id=settings.DEFAULT_OWNER_ID,
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


@router.post("/create_idea", operation_id="create_idea", status_code=status.HTTP_201_CREATED, summary="Create Idea")
def create_idea(
    data: IdeaCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Capture a new idea under authenticated user."""
    idea = idea_service.create_idea(db=db, user_id=settings.DEFAULT_OWNER_ID, data=data)
    return {
        "data": idea.model_dump(),
    }


@router.get("/get_idea_by_id/{idea_id}", operation_id="get_idea_by_id", summary="Get Idea By Id")
def get_idea_by_id(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single idea by ID."""
    idea = idea_service.get_idea_response(db=db, user_id=settings.DEFAULT_OWNER_ID, idea_id=idea_id)
    return {
        "data": idea.model_dump(),
    }


@router.patch("/update_idea_by_id/{idea_id}", operation_id="update_idea_by_id", summary="Update Idea By Id")
def update_idea_by_id(
    idea_id: uuid.UUID,
    data: IdeaUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update idea details."""
    idea = idea_service.update_idea(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        idea_id=idea_id,
        data=data,
    )
    return {
        "data": idea.model_dump(),
    }


@router.post("/promote_idea_by_id/{idea_id}", operation_id="promote_idea_by_id", summary="Promote Idea By Id")
def promote_idea_by_id(
    idea_id: uuid.UUID,
    data: IdeaPromoteRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Promote an idea into a Project or Task."""
    idea, created_entity = idea_service.promote_idea(
        db=db,
        user_id=settings.DEFAULT_OWNER_ID,
        idea_id=idea_id,
        data=data,
    )
    return {
        "data": {
            "idea": idea.model_dump(),
            "promoted_entity": created_entity,
        }
    }


@router.delete("/delete_idea_by_id/{idea_id}", operation_id="delete_idea_by_id", summary="Delete Idea By Id")
def delete_idea_by_id(
    idea_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete an idea."""
    idea_service.delete_idea(db=db, user_id=settings.DEFAULT_OWNER_ID, idea_id=idea_id)
    return {
        "data": {
            "message": "Idea deleted successfully.",
        }
    }
