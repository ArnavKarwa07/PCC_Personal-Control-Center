"""Goals & OKRs REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.goal import GoalStatus
from app.models.user import User
from app.schemas.goal import GoalCreate, GoalRead, GoalUpdate
from app.services.goal_service import goal_service

router = APIRouter(prefix="/goals", tags=["Goals"])


@router.get("", operation_id="listGoals", summary="List Goals")
def list_goals(
    status: Optional[GoalStatus] = None,
    time_period: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve goals and OKR hierarchy."""
    goals, total, total_pages = goal_service.list_goals(
        db=db, user_id=current_user.id, status=status, time_period=time_period, page=page, per_page=per_page
    )
    return {
        "data": [GoalRead.model_validate(g).model_dump() for g in goals],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("", operation_id="createGoal", status_code=status.HTTP_201_CREATED, summary="Create Goal")
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new goal or OKR objective with milestones."""
    goal = goal_service.create_goal(db=db, user_id=current_user.id, data=data)
    return {"data": GoalRead.model_validate(goal).model_dump()}


@router.patch("/{goal_id}", operation_id="updateGoalById", summary="Update Goal")
def update_goal(
    goal_id: uuid.UUID,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update goal status or progress percentage."""
    goal = goal_service.update_goal(db=db, user_id=current_user.id, goal_id=goal_id, data=data)
    if not goal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    return {"data": GoalRead.model_validate(goal).model_dump()}


@router.delete("/{goal_id}", operation_id="deleteGoalById", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Goal")
def delete_goal(
    goal_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a goal."""
    success = goal_service.delete_goal(db=db, user_id=current_user.id, goal_id=goal_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
