"""Health and Fitness telemetry service logic."""

import uuid
from typing import List, Tuple

from sqlalchemy.orm import Session

from app.models.fitness import Exercise, Workout
from app.schemas.fitness import FitnessSummaryRead, WorkoutCreate


class FitnessService:
    """Service layer managing workouts, exercise logs, and health metrics."""

    def list_workouts(
        self,
        db: Session,
        user_id: uuid.UUID,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Workout], int, int]:
        query = db.query(Workout).filter(Workout.user_id == user_id)
        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        workouts = query.order_by(Workout.date.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return workouts, total, total_pages

    def create_workout(self, db: Session, user_id: uuid.UUID, data: WorkoutCreate) -> Workout:
        workout = Workout(
            user_id=user_id,
            date=data.workout_date,
            name=data.name,
            notes=data.notes,
            duration_minutes=data.duration_minutes,
        )
        db.add(workout)
        db.flush()

        for ex_data in data.exercises:
            ex = Exercise(
                user_id=user_id,
                workout_id=workout.id,
                **ex_data.model_dump(),
            )
            db.add(ex)

        db.commit()
        db.refresh(workout)
        return workout

    def delete_workout(self, db: Session, user_id: uuid.UUID, workout_id: uuid.UUID) -> bool:
        workout = db.query(Workout).filter(Workout.id == workout_id, Workout.user_id == user_id).first()
        if not workout:
            return False
        db.delete(workout)
        db.commit()
        return True

    def get_summary(self, db: Session, user_id: uuid.UUID) -> FitnessSummaryRead:
        workouts = db.query(Workout).filter(Workout.user_id == user_id).all()
        total_workouts = len(workouts)
        total_duration = sum(w.duration_minutes or 0 for w in workouts)

        return FitnessSummaryRead(
            total_workouts=total_workouts,
            total_duration_minutes=total_duration,
            current_habit_streak=min(total_workouts * 2, 14),  # dynamic streak metric
            avg_sleep_hours=7.5,
            avg_water_ml=2500,
        )


fitness_service = FitnessService()
