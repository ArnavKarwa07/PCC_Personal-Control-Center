"""Health & Fitness REST API endpoints."""

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.fitness import FitnessSummaryRead, WorkoutCreate, WorkoutRead
from app.services.fitness_service import fitness_service

router = APIRouter(prefix="/fitness", tags=["Fitness"])


@router.get("/summary", response_model=FitnessSummaryRead, summary="Get Fitness Summary")
def get_fitness_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve workout statistics, habit streak metrics, and telemetry averages."""
    return fitness_service.get_summary(db=db, user_id=current_user.id)


@router.get("/workouts", summary="List Workouts")
def list_workouts(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve logged workout sessions with exercise details."""
    workouts, total, total_pages = fitness_service.list_workouts(
        db=db, user_id=current_user.id, page=page, per_page=per_page
    )
    return {
        "data": [WorkoutRead.model_validate(w).model_dump() for w in workouts],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/workouts", status_code=status.HTTP_201_CREATED, summary="Create Workout")
def create_workout(
    data: WorkoutCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Log a new workout session with exercises."""
    workout = fitness_service.create_workout(db=db, user_id=current_user.id, data=data)
    return {"data": WorkoutRead.model_validate(workout).model_dump()}


@router.delete("/workouts/{workout_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Workout")
def delete_workout(
    workout_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a workout session."""
    success = fitness_service.delete_workout(db=db, user_id=current_user.id, workout_id=workout_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Workout not found")
