"""Goals and OKRs service layer."""

import uuid
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.goal import Goal, GoalMilestone, GoalStatus
from app.schemas.goal import GoalCreate, GoalUpdate


class GoalService:
    """Service layer managing personal goals, OKRs, and milestone rollups."""

    def list_goals(
        self,
        db: Session,
        user_id: uuid.UUID,
        status: Optional[GoalStatus] = None,
        time_period: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Goal], int, int]:
        query = db.query(Goal).filter(Goal.user_id == user_id)
        if status:
            query = query.filter(Goal.status == status)
        if time_period:
            query = query.filter(Goal.time_period.ilike(f"%{time_period}%"))

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        goals = query.order_by(Goal.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return goals, total, total_pages

    def create_goal(self, db: Session, user_id: uuid.UUID, data: GoalCreate) -> Goal:
        goal = Goal(
            user_id=user_id,
            name=data.name,
            description=data.description,
            parent_goal_id=data.parent_goal_id,
            time_period=data.time_period,
            status=data.status,
            progress=data.progress,
        )
        db.add(goal)
        db.flush()

        for m_data in data.milestones:
            m = GoalMilestone(
                user_id=user_id,
                goal_id=goal.id,
                name=m_data.name,
                target_date=m_data.target_date,
            )
            db.add(m)

        db.commit()
        db.refresh(goal)
        return goal

    def update_goal(self, db: Session, user_id: uuid.UUID, goal_id: uuid.UUID, data: GoalUpdate) -> Optional[Goal]:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            return None

        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(goal, key, val)

        # Auto-update status if progress is 100%
        if goal.progress >= 100.0:
            goal.status = GoalStatus.COMPLETED

        db.commit()
        db.refresh(goal)
        return goal

    def get_goal(self, db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> Optional[Goal]:
        return db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()

    def delete_goal(self, db: Session, user_id: uuid.UUID, goal_id: uuid.UUID) -> bool:
        goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == user_id).first()
        if not goal:
            return False
        db.delete(goal)
        db.commit()
        return True


goal_service = GoalService()
