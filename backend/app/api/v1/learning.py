"""Learning Center REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.learning import LearningResourceType, LearningStatus
from app.models.user import User
from app.schemas.learning import (
    LearningItemCreate,
    LearningItemListResponse,
    LearningItemResponse,
    LearningItemUpdate,
    LearningStatsResponse,
)
from app.services.learning_service import learning_service

router = APIRouter(prefix="/learning", tags=["Learning"])


@router.get("", response_model=LearningItemListResponse, summary="List Learning Items")
def list_learning_items(
    resource_type: Optional[LearningResourceType] = None,
    status: Optional[LearningStatus] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve learning resources with filtering, search, and pagination."""
    items, total, total_pages = learning_service.list_items(
        db=db,
        user_id=current_user.id,
        resource_type=resource_type,
        status=status,
        search=search,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [LearningItemResponse.model_validate(item).model_dump() for item in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.get("/stats", response_model=LearningStatsResponse, summary="Get Learning Stats")
def get_learning_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve aggregate learning metrics and category distribution."""
    stats = learning_service.get_stats(db=db, user_id=current_user.id)
    return stats


@router.get("/{item_id}", response_model=dict, summary="Get Learning Item")
def get_learning_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single learning item by ID."""
    item = learning_service.get_item(db=db, user_id=current_user.id, item_id=item_id)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning item not found")
    return {"data": LearningItemResponse.model_validate(item).model_dump()}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Learning Item")
def create_learning_item(
    data: LearningItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new learning item or reading list entry."""
    item = learning_service.create_item(db=db, user_id=current_user.id, data=data)
    return {"data": LearningItemResponse.model_validate(item).model_dump()}


@router.patch("/{item_id}", summary="Update Learning Item")
def update_learning_item(
    item_id: uuid.UUID,
    data: LearningItemUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update learning item status, progress, or metadata."""
    item = learning_service.update_item(db=db, user_id=current_user.id, item_id=item_id, data=data)
    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning item not found")
    return {"data": LearningItemResponse.model_validate(item).model_dump()}


@router.delete("/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Learning Item")
def delete_learning_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a learning item."""
    success = learning_service.delete_item(db=db, user_id=current_user.id, item_id=item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning item not found")
