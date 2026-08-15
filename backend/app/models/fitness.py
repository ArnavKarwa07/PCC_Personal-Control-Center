"""Fitness models: Workout and Exercise."""

import enum

from sqlalchemy import Column, Date, Enum, Float, ForeignKey, Integer, String, Text, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class ExerciseType(str, enum.Enum):
    STRENGTH = "strength"
    CARDIO = "cardio"
    FLEXIBILITY = "flexibility"


class Workout(BaseModel):
    """Workout session log."""

    __tablename__ = "workouts"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    date = Column(Date, nullable=False, index=True)
    name = Column(String(255), nullable=True)
    notes = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=True)

    exercises = relationship("Exercise", back_populates="workout", cascade="all, delete-orphan")


class Exercise(BaseModel):
    """Exercise entry performed during a workout."""

    __tablename__ = "exercises"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    workout_id = Column(Uuid(as_uuid=True), ForeignKey("workouts.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    sets = Column(Integer, nullable=True)
    reps = Column(Integer, nullable=True)
    weight = Column(Float, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    exercise_type = Column(
        Enum(ExerciseType, name="exercise_type", values_callable=lambda obj: [e.value for e in obj]),
        default=ExerciseType.STRENGTH,
        nullable=False,
    )

    workout = relationship("Workout", back_populates="exercises")
