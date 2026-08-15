"""Pydantic schemas for Health & Fitness telemetry."""

import uuid
from datetime import date as PyDate
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.fitness import ExerciseType


class ExerciseBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sets: Optional[int] = Field(default=None, ge=1)
    reps: Optional[int] = Field(default=None, ge=1)
    weight: Optional[float] = Field(default=None, ge=0.0)
    duration_seconds: Optional[int] = Field(default=None, ge=0)
    exercise_type: ExerciseType = Field(default=ExerciseType.STRENGTH)


class ExerciseCreate(ExerciseBase):
    pass


class ExerciseRead(ExerciseBase):
    id: uuid.UUID
    workout_id: uuid.UUID

    class Config:
        from_attributes = True


class WorkoutBase(BaseModel):
    workout_date: PyDate = Field(..., alias="date", description="Workout date")
    name: Optional[str] = Field(default=None, max_length=255)
    notes: Optional[str] = None
    duration_minutes: Optional[int] = Field(default=None, ge=1)

    class Config:
        populate_by_name = True


class WorkoutCreate(WorkoutBase):
    exercises: List[ExerciseCreate] = Field(default_factory=list)


class WorkoutRead(WorkoutBase):
    id: uuid.UUID
    user_id: uuid.UUID
    exercises: List[ExerciseRead] = Field(default_factory=list)

    class Config:
        from_attributes = True
        populate_by_name = True


class HealthLogCreate(BaseModel):
    log_date: PyDate = Field(..., alias="date")
    water_ml: int = Field(default=0, ge=0)
    sleep_hours: float = Field(default=0.0, ge=0.0, le=24.0)
    habit_completed: bool = Field(default=True)

    class Config:
        populate_by_name = True


class FitnessSummaryRead(BaseModel):
    total_workouts: int
    total_duration_minutes: int
    current_habit_streak: int
    avg_sleep_hours: float
    avg_water_ml: int
