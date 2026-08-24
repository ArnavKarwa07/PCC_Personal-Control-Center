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
        status: Optional[GoalStatus] = None,
        time_period: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Goal], int, int]:
        query = db.query(Goal)
        if status:
            query = query.filter(Goal.status == status)
        if time_period:
            query = query.filter(Goal.time_period.ilike(f"%{time_period}%"))

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        goals = query.order_by(Goal.created_at.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return goals, total, total_pages

    def create_goal(self, db: Session, data: GoalCreate) -> Goal:
        goal = Goal(
            name=data.name,
            description=data.description,
            parent_goal_id=data.parent_goal_id,
            time_period=data.time_period,
            status=data.status,
            progress=data.progress,
        )
        db.add(goal)
        db.flush()

        from datetime import datetime, timezone

        for m_data in data.milestones:
            m = GoalMilestone(
                goal_id=goal.id,
                name=m_data.name,
                target_date=m_data.target_date,
                completed_at=datetime.now(timezone.utc) if getattr(m_data, "completed", False) else None,
            )
            db.add(m)

        db.commit()
        db.refresh(goal)
        return goal

    def update_goal(self, db: Session, goal_id: uuid.UUID, data: GoalUpdate) -> Optional[Goal]:
        from datetime import datetime, timezone

        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return None

        update_data = data.model_dump(exclude_unset=True)
        milestones_data = update_data.pop("milestones", None)

        for key, val in update_data.items():
            setattr(goal, key, val)

        if milestones_data is not None:
            db.query(GoalMilestone).filter(GoalMilestone.goal_id == goal_id).delete()
            for m_item in milestones_data:
                name = m_item.get("name") if isinstance(m_item, dict) else getattr(m_item, "name", "Milestone")
                target_date = (
                    m_item.get("target_date") if isinstance(m_item, dict) else getattr(m_item, "target_date", None)
                )
                completed = m_item.get("completed") if isinstance(m_item, dict) else getattr(m_item, "completed", False)
                m = GoalMilestone(
                    goal_id=goal.id,
                    name=name,
                    target_date=target_date,
                    completed_at=datetime.now(timezone.utc) if completed else None,
                )
                db.add(m)

        # Auto-update status if progress is 100%
        if goal.progress >= 100.0:
            goal.status = GoalStatus.COMPLETED

        db.commit()
        db.refresh(goal)
        return goal

    def get_goal(self, db: Session, goal_id: uuid.UUID) -> Optional[Goal]:
        return db.query(Goal).filter(Goal.id == goal_id).first()

    def delete_goal(self, db: Session, goal_id: uuid.UUID) -> bool:
        goal = db.query(Goal).filter(Goal.id == goal_id).first()
        if not goal:
            return False
        db.delete(goal)
        db.commit()
        return True


goal_service = GoalService()
