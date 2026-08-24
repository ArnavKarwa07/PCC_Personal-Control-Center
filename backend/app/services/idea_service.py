"""Idea management and incubator promotion business logic."""

import math
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException, ValidationException
from app.models.idea import Idea, IdeaStatus
from app.models.project import ProjectPriority, ProjectStatus
from app.models.task import TaskPriority, TaskStatus
from app.schemas.idea import (
    IdeaCreate,
    IdeaPromoteRequest,
    IdeaResponse,
    IdeaUpdate,
)
from app.schemas.project import ProjectCreate
from app.schemas.task import TaskCreate
from app.services.project_service import project_service
from app.services.task_service import task_service


class IdeaService:
    """Service providing CRUD and promotion workflows for ideas."""

    @staticmethod
    def _format_idea_response(idea: Idea) -> IdeaResponse:
        """Convert Idea model instance into IdeaResponse schema."""
        return IdeaResponse(
            id=idea.id,
            title=idea.title,
            description=idea.description,
            category=idea.category,
            status=idea.status,
            promoted_to_type=idea.promoted_to_type,
            promoted_to_id=idea.promoted_to_id,
            created_at=idea.created_at,
            updated_at=idea.updated_at,
        )

    @classmethod
    def list_ideas(
        cls,
        db: Session,
        status: Optional[IdeaStatus] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[IdeaResponse], int, int]:
        """List ideas with optional filtering and pagination."""
        query = db.query(Idea).filter(
            Idea.deleted_at.is_(None),
        )

        if status is not None:
            query = query.filter(Idea.status == status)
        if category:
            query = query.filter(Idea.category == category)
        if search:
            query = query.filter((Idea.title.ilike(f"%{search}%")) | (Idea.description.ilike(f"%{search}%")))

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        ideas = query.order_by(Idea.created_at.desc()).offset(offset).limit(per_page).all()

        formatted_ideas = [cls._format_idea_response(i) for i in ideas]
        return formatted_ideas, total, total_pages

    @classmethod
    def create_idea(cls, db: Session, data: IdeaCreate) -> IdeaResponse:
        """Capture a new idea."""
        idea = Idea(
            title=data.title,
            description=data.description,
            category=data.category,
            status=data.status or IdeaStatus.CAPTURED,
        )
        db.add(idea)
        db.commit()
        db.refresh(idea)
        return cls._format_idea_response(idea)

    @classmethod
    def get_idea(cls, db: Session, idea_id: uuid.UUID) -> Idea:
        """Retrieve idea by ID enforcing soft deletion check."""
        idea = (
            db.query(Idea)
            .filter(
                Idea.id == idea_id,
                Idea.deleted_at.is_(None),
            )
            .first()
        )
        if not idea:
            raise NotFoundException(message="Idea not found", code="IDEA_NOT_FOUND")
        return idea

    @classmethod
    def get_idea_response(cls, db: Session, idea_id: uuid.UUID) -> IdeaResponse:
        """Retrieve idea and return formatted IdeaResponse."""
        idea = cls.get_idea(db, idea_id)
        return cls._format_idea_response(idea)

    @classmethod
    def update_idea(cls, db: Session, idea_id: uuid.UUID, data: IdeaUpdate) -> IdeaResponse:
        """Update fields of an existing idea."""
        idea = cls.get_idea(db, idea_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(idea, field, value)

        db.commit()
        db.refresh(idea)
        return cls._format_idea_response(idea)

    @classmethod
    def promote_idea(
        cls,
        db: Session,
        idea_id: uuid.UUID,
        data: IdeaPromoteRequest,
    ) -> Tuple[IdeaResponse, Dict[str, Any]]:
        """Promote an idea into a Project or Task automatically and update idea status."""
        idea = cls.get_idea(db, idea_id)

        target_title = data.target_name or idea.title
        target_description = data.target_description or idea.description

        created_entity_data: Dict[str, Any] = {}

        if data.promote_to == "project":
            priority = ProjectPriority.MEDIUM
            if data.priority:
                try:
                    priority = ProjectPriority(data.priority.lower())
                except ValueError:
                    priority = ProjectPriority.MEDIUM

            project_payload = ProjectCreate(
                name=target_title,
                description=target_description,
                status=ProjectStatus.PLANNED,
                priority=priority,
                deadline=data.deadline,
            )
            project_resp = project_service.create_project(db=db, data=project_payload)
            idea.promoted_to_type = "project"
            idea.promoted_to_id = project_resp.id
            created_entity_data = {"type": "project", "entity": project_resp.model_dump()}

        elif data.promote_to == "task":
            priority = TaskPriority.MEDIUM
            if data.priority:
                try:
                    priority = TaskPriority(data.priority.lower())
                except ValueError:
                    priority = TaskPriority.MEDIUM

            task_payload = TaskCreate(
                title=target_title,
                description=target_description,
                status=TaskStatus.TODO,
                priority=priority,
                due_date=data.due_date,
                project_id=data.target_project_id,
            )
            task_resp = task_service.create_task(db=db, data=task_payload)
            idea.promoted_to_type = "task"
            idea.promoted_to_id = task_resp.id
            created_entity_data = {"type": "task", "entity": task_resp.model_dump()}

        else:
            raise ValidationException(message="Invalid promotion target", code="INVALID_PROMOTION_TARGET")

        idea.status = IdeaStatus.PROMOTED
        db.commit()
        db.refresh(idea)

        return cls._format_idea_response(idea), created_entity_data

    @classmethod
    def delete_idea(cls, db: Session, idea_id: uuid.UUID) -> None:
        """Soft delete an idea."""
        idea = cls.get_idea(db, idea_id)
        idea.deleted_at = datetime.now(timezone.utc)
        db.commit()


idea_service = IdeaService()
