"""Reviews and weekly retrospectives REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.review import ReviewStatus
from app.models.user import User
from app.schemas.review import (
    ReviewCreate,
    ReviewEntryCreate,
    ReviewEntryResponse,
    ReviewResponse,
    ReviewStatsResponse,
    ReviewUpdate,
)
from app.services.review_service import review_service

router = APIRouter(prefix="/reviews", tags=["Reviews"])


@router.get("", summary="List Reviews")
def list_reviews(
    status: Optional[ReviewStatus] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated weekly/monthly reviews."""
    reviews, total, total_pages = review_service.list_reviews(
        db=db, user_id=current_user.id, status=status, page=page, per_page=per_page
    )
    return {
        "data": [ReviewResponse.model_validate(r).model_dump() for r in reviews],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.get("/stats", summary="Get Review Statistics")
def get_review_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve review metrics, completion rate, and consecutive weekly streaks."""
    stats_data = review_service.get_stats(db=db, user_id=current_user.id)
    return {"data": ReviewStatsResponse.model_validate(stats_data).model_dump()}


@router.get("/current", summary="Get Current Week Review")
def get_current_review(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve the review corresponding to the current active week if one exists."""
    review = review_service.get_current_week_review(db=db, user_id=current_user.id)
    if not review:
        return {"data": None}
    return {"data": ReviewResponse.model_validate(review).model_dump()}


@router.get("/{review_id}", summary="Get Review Detail")
def get_review(
    review_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single review session by ID along with all guided reflection entries."""
    review = review_service.get_review(db=db, user_id=current_user.id, review_id=review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return {"data": ReviewResponse.model_validate(review).model_dump()}


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Review")
def create_review(
    data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new review session initialized with guided reflection sections."""
    review = review_service.create_review(db=db, user_id=current_user.id, data=data)
    return {"data": ReviewResponse.model_validate(review).model_dump()}


@router.patch("/{review_id}", summary="Update Review")
def update_review(
    review_id: uuid.UUID,
    data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update review date range, status, or reflection entries."""
    review = review_service.update_review(db=db, user_id=current_user.id, review_id=review_id, data=data)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return {"data": ReviewResponse.model_validate(review).model_dump()}


@router.post("/{review_id}/entries", summary="Upsert Section Entry")
def upsert_review_entry(
    review_id: uuid.UUID,
    data: ReviewEntryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add or update an individual reflection section entry in a review."""
    entry = review_service.upsert_entry(
        db=db,
        user_id=current_user.id,
        review_id=review_id,
        section=data.section,
        content=data.content,
        sort_order=data.sort_order,
    )
    if not entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return {"data": ReviewEntryResponse.model_validate(entry).model_dump()}


@router.patch("/{review_id}/complete", summary="Complete Review")
def complete_review(
    review_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark a review as completed and lock reflection timestamps."""
    review = review_service.complete_review(db=db, user_id=current_user.id, review_id=review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return {"data": ReviewResponse.model_validate(review).model_dump()}


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Review")
def delete_review(
    review_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a review session."""
    success = review_service.delete_review(db=db, user_id=current_user.id, review_id=review_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
