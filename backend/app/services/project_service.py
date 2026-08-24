"""Project and Kanban Board business logic."""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.board import Board, BoardCard, BoardColumn
from app.models.contact import Contact
from app.models.project import Project, ProjectMember, ProjectPriority, ProjectStatus
from app.models.tag import Tag
from app.models.task import Task, TaskStatus
from app.schemas.project import (
    BoardCardCreate,
    BoardCardMove,
    BoardCardResponse,
    BoardCardTaskSummary,
    BoardColumnCreate,
    BoardColumnResponse,
    BoardCreate,
    BoardResponse,
    ProjectCreate,
    ProjectMemberCreate,
    ProjectMemberResponse,
    ProjectResponse,
    ProjectUpdate,
)


class ProjectService:
    """Service providing CRUD and lifecycle operations for Projects and Kanban boards."""

    @staticmethod
    def _calculate_progress(project: Project) -> float:
        """Calculate project progress percentage based on linked tasks."""
        active_tasks = [t for t in (project.tasks or []) if t.deleted_at is None]
        if not active_tasks:
            return round(project.progress or 0.0, 1)
        completed_tasks = [t for t in active_tasks if t.status == TaskStatus.DONE]
        return round((len(completed_tasks) / len(active_tasks)) * 100.0, 1)

    @classmethod
    def _format_project_response(cls, project: Project) -> ProjectResponse:
        """Convert Project model instance into ProjectResponse with tags and dynamic progress."""
        tag_names = [t.name for t in (project.tags or []) if t.deleted_at is None]
        active_tasks = [t for t in (project.tasks or []) if t.deleted_at is None]
        completed_tasks = [t for t in active_tasks if t.status == TaskStatus.DONE]
        progress = cls._calculate_progress(project)

        member_responses = [
            ProjectMemberResponse(
                id=m.id,
                project_id=m.project_id,
                contact_id=m.contact_id,
                role=m.role,
                created_at=m.created_at,
            )
            for m in (project.members or [])
            if m.deleted_at is None
        ]

        return ProjectResponse(
            id=project.id,
            name=project.name,
            description=project.description,
            status=project.status,
            priority=project.priority,
            start_date=project.start_date,
            deadline=project.deadline,
            progress=progress,
            created_at=project.created_at,
            updated_at=project.updated_at,
            tags=tag_names,
            members=member_responses,
            task_count=len(active_tasks),
            completed_task_count=len(completed_tasks),
        )

    @staticmethod
    def _format_card_response(card: BoardCard) -> BoardCardResponse:
        """Format a BoardCard model into BoardCardResponse with task summary."""
        task_summary = None
        if card.task and card.task.deleted_at is None:
            task_summary = BoardCardTaskSummary(
                id=card.task.id,
                title=card.task.title,
                status=card.task.status.value if hasattr(card.task.status, "value") else str(card.task.status),
                priority=card.task.priority.value if hasattr(card.task.priority, "value") else str(card.task.priority),
                due_date=card.task.due_date,
            )

        return BoardCardResponse(
            id=card.id,
            column_id=card.column_id,
            task_id=card.task_id,
            position=card.position,
            task=task_summary,
            created_at=card.created_at,
            updated_at=card.updated_at,
        )

    @classmethod
    def _format_board_response(cls, board: Board) -> BoardResponse:
        """Format a Board model into BoardResponse with columns and cards."""
        columns_response = []
        active_columns = [col for col in (board.columns or []) if col.deleted_at is None]
        active_columns.sort(key=lambda c: c.position)

        for col in active_columns:
            active_cards = [card for card in (col.cards or []) if card.deleted_at is None]
            active_cards.sort(key=lambda c: c.position)
            cards_response = [cls._format_card_response(card) for card in active_cards]

            columns_response.append(
                BoardColumnResponse(
                    id=col.id,
                    board_id=col.board_id,
                    name=col.name,
                    position=col.position,
                    color=col.color,
                    cards=cards_response,
                    created_at=col.created_at,
                    updated_at=col.updated_at,
                )
            )

        return BoardResponse(
            id=board.id,
            project_id=board.project_id,
            name=board.name,
            columns=columns_response,
            created_at=board.created_at,
            updated_at=board.updated_at,
        )

    @staticmethod
    def _get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
        """Find existing tags by name or create new ones."""
        tags = []
        for raw_name in tag_names:
            name = raw_name.strip()
            if not name:
                continue
            tag = (
                db.query(Tag)
                .filter(
                    func.lower(Tag.name) == name.lower(),
                    Tag.deleted_at.is_(None),
                )
                .first()
            )
            if not tag:
                tag = Tag(name=name)
                db.add(tag)
                db.flush()
            tags.append(tag)
        return tags

    # -----------------------------------------------------------------------
    # Projects CRUD
    # -----------------------------------------------------------------------

    @classmethod
    def list_projects(
        cls,
        db: Session,
        status: Optional[ProjectStatus] = None,
        priority: Optional[ProjectPriority] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[ProjectResponse], int, int]:
        """List projects with filtering and pagination."""
        query = db.query(Project).filter(
            Project.deleted_at.is_(None),
        )

        if status is not None:
            query = query.filter(Project.status == status)
        if priority is not None:
            query = query.filter(Project.priority == priority)
        if search:
            query = query.filter(Project.name.ilike(f"%{search}%"))

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        projects = query.order_by(Project.created_at.desc()).offset(offset).limit(per_page).all()

        formatted_projects = [cls._format_project_response(p) for p in projects]
        return formatted_projects, total, total_pages

    @classmethod
    def create_project(cls, db: Session, data: ProjectCreate) -> ProjectResponse:
        """Create a new project and initialize a default Kanban board."""
        project_data = data.model_dump(exclude={"tags"})
        project = Project(**project_data)

        if data.tags:
            project.tags = cls._get_or_create_tags(db, data.tags)

        db.add(project)
        db.flush()

        # Create default Kanban Board with standard columns
        board = Board(project_id=project.id, name=f"{project.name} Board")
        db.add(board)
        db.flush()

        default_columns = [
            ("To Do", 0, "#64748b"),
            ("In Progress", 1, "#3b82f6"),
            ("Done", 2, "#10b981"),
        ]
        for col_name, pos, col_color in default_columns:
            column = BoardColumn(board_id=board.id, name=col_name, position=pos, color=col_color)
            db.add(column)

        db.commit()
        db.refresh(project)
        return cls._format_project_response(project)

    @classmethod
    def get_project(cls, db: Session, project_id: uuid.UUID) -> Project:
        """Retrieve project by ID enforcing soft deletion check."""
        project = (
            db.query(Project)
            .filter(
                Project.id == project_id,
                Project.deleted_at.is_(None),
            )
            .first()
        )
        if not project:
            raise NotFoundException(message="Project not found", code="PROJECT_NOT_FOUND")
        return project

    @classmethod
    def get_project_response(cls, db: Session, project_id: uuid.UUID) -> ProjectResponse:
        """Retrieve project and return formatted response."""
        project = cls.get_project(db, project_id)
        return cls._format_project_response(project)

    @classmethod
    def update_project(cls, db: Session, project_id: uuid.UUID, data: ProjectUpdate) -> ProjectResponse:
        """Update fields of an existing project."""
        project = cls.get_project(db, project_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"tags"})

        for field, value in update_data.items():
            setattr(project, field, value)

        if data.tags is not None:
            project.tags = cls._get_or_create_tags(db, data.tags)

        db.commit()
        db.refresh(project)
        return cls._format_project_response(project)

    @classmethod
    def delete_project(cls, db: Session, project_id: uuid.UUID) -> None:
        """Soft delete a project."""
        project = cls.get_project(db, project_id)
        project.deleted_at = datetime.now(timezone.utc)
        db.commit()

    # -----------------------------------------------------------------------
    # Project Members
    # -----------------------------------------------------------------------

    @classmethod
    def add_project_member(cls, db: Session, project_id: uuid.UUID, data: ProjectMemberCreate) -> ProjectMemberResponse:
        """Assign a contact as a project member."""
        project = cls.get_project(db, project_id)

        # Validate contact exists
        contact = db.query(Contact).filter(Contact.id == data.contact_id, Contact.deleted_at.is_(None)).first()
        if not contact:
            raise NotFoundException(message="Contact not found", code="CONTACT_NOT_FOUND")

        # Check existing member
        existing_member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.project_id == project.id,
                ProjectMember.contact_id == data.contact_id,
                ProjectMember.deleted_at.is_(None),
            )
            .first()
        )
        if existing_member:
            existing_member.role = data.role
            db.commit()
            db.refresh(existing_member)
            return ProjectMemberResponse(
                id=existing_member.id,
                project_id=existing_member.project_id,
                contact_id=existing_member.contact_id,
                role=existing_member.role,
                created_at=existing_member.created_at,
            )

        member = ProjectMember(
            project_id=project.id,
            contact_id=data.contact_id,
            role=data.role,
        )
        db.add(member)
        db.commit()
        db.refresh(member)
        return ProjectMemberResponse(
            id=member.id,
            project_id=member.project_id,
            contact_id=member.contact_id,
            role=member.role,
            created_at=member.created_at,
        )

    @classmethod
    def remove_project_member(cls, db: Session, project_id: uuid.UUID, member_id: uuid.UUID) -> None:
        """Remove a member from project (soft delete)."""
        cls.get_project(db, project_id)
        member = (
            db.query(ProjectMember)
            .filter(
                ProjectMember.id == member_id,
                ProjectMember.project_id == project_id,
                ProjectMember.deleted_at.is_(None),
            )
            .first()
        )
        if not member:
            raise NotFoundException(message="Project member not found", code="MEMBER_NOT_FOUND")
        member.deleted_at = datetime.now(timezone.utc)
        db.commit()

    # -----------------------------------------------------------------------
    # Kanban Board Operations
    # -----------------------------------------------------------------------

    @classmethod
    def get_project_board(cls, db: Session, project_id: uuid.UUID) -> BoardResponse:
        """Get or auto-create the board associated with a project."""
        project = cls.get_project(db, project_id)
        board = (
            db.query(Board)
            .filter(
                Board.project_id == project.id,
                Board.deleted_at.is_(None),
            )
            .first()
        )
        if not board:
            board = Board(project_id=project.id, name=f"{project.name} Board")
            db.add(board)
            db.flush()

            default_columns = [
                ("To Do", 0, "#64748b"),
                ("In Progress", 1, "#3b82f6"),
                ("Done", 2, "#10b981"),
            ]
            for col_name, pos, col_color in default_columns:
                column = BoardColumn(board_id=board.id, name=col_name, position=pos, color=col_color)
                db.add(column)
            db.commit()
            db.refresh(board)

        return cls._format_board_response(board)

    @classmethod
    def create_board(cls, db: Session, data: BoardCreate) -> BoardResponse:
        """Create a new Kanban board with optional columns."""
        if data.project_id:
            cls.get_project(db, data.project_id)

        board = Board(project_id=data.project_id, name=data.name)
        db.add(board)
        db.flush()

        columns = data.columns if data.columns else ["To Do", "In Progress", "Done"]
        for idx, col_name in enumerate(columns):
            column = BoardColumn(board_id=board.id, name=col_name, position=idx)
            db.add(column)

        db.commit()
        db.refresh(board)
        return cls._format_board_response(board)

    @classmethod
    def get_board(cls, db: Session, board_id: uuid.UUID) -> BoardResponse:
        """Retrieve a board by ID."""
        board = (
            db.query(Board)
            .filter(
                Board.id == board_id,
                Board.deleted_at.is_(None),
            )
            .first()
        )
        if not board:
            raise NotFoundException(message="Board not found", code="BOARD_NOT_FOUND")
        return cls._format_board_response(board)

    @classmethod
    def create_column(cls, db: Session, board_id: uuid.UUID, data: BoardColumnCreate) -> BoardColumnResponse:
        """Add a column to an existing board."""
        board = db.query(Board).filter(Board.id == board_id, Board.deleted_at.is_(None)).first()
        if not board:
            raise NotFoundException(message="Board not found", code="BOARD_NOT_FOUND")

        position = data.position
        if position is None:
            max_pos = (
                db.query(func.coalesce(func.max(BoardColumn.position), -1))
                .filter(BoardColumn.board_id == board_id, BoardColumn.deleted_at.is_(None))
                .scalar()
            )
            position = max_pos + 1

        column = BoardColumn(
            board_id=board_id,
            name=data.name,
            position=position,
            color=data.color,
        )
        db.add(column)
        db.commit()
        db.refresh(column)

        return BoardColumnResponse(
            id=column.id,
            board_id=column.board_id,
            name=column.name,
            position=column.position,
            color=column.color,
            cards=[],
            created_at=column.created_at,
            updated_at=column.updated_at,
        )

    @classmethod
    def create_card(cls, db: Session, data: BoardCardCreate) -> BoardCardResponse:
        """Create a board card placing a task in a column."""
        # Verify column
        column = (
            db.query(BoardColumn).filter(BoardColumn.id == data.column_id, BoardColumn.deleted_at.is_(None)).first()
        )
        if not column:
            raise NotFoundException(message="Column not found", code="COLUMN_NOT_FOUND")

        # Verify task
        task = db.query(Task).filter(Task.id == data.task_id, Task.deleted_at.is_(None)).first()
        if not task:
            raise NotFoundException(message="Task not found", code="TASK_NOT_FOUND")

        position = data.position
        if position is None or position < 0:
            max_pos = (
                db.query(func.coalesce(func.max(BoardCard.position), -1))
                .filter(BoardCard.column_id == data.column_id, BoardCard.deleted_at.is_(None))
                .scalar()
            )
            position = max_pos + 1

        card = BoardCard(
            column_id=data.column_id,
            task_id=data.task_id,
            position=position,
        )
        db.add(card)
        db.commit()
        db.refresh(card)
        return cls._format_card_response(card)

    @classmethod
    def move_card(cls, db: Session, card_id: uuid.UUID, data: BoardCardMove) -> BoardCardResponse:
        """Move and reorder a board card within or across columns."""
        card = db.query(BoardCard).filter(BoardCard.id == card_id, BoardCard.deleted_at.is_(None)).first()
        if not card:
            raise NotFoundException(message="Card not found", code="CARD_NOT_FOUND")

        target_column_id = data.column_id if data.column_id else card.column_id

        # Verify target column
        target_column = (
            db.query(BoardColumn).filter(BoardColumn.id == target_column_id, BoardColumn.deleted_at.is_(None)).first()
        )
        if not target_column:
            raise NotFoundException(message="Target column not found", code="COLUMN_NOT_FOUND")

        target_position = max(0, data.position)

        if card.column_id == target_column_id:
            # Reordering in the same column
            sibling_cards = (
                db.query(BoardCard)
                .filter(
                    BoardCard.column_id == target_column_id,
                    BoardCard.id != card.id,
                    BoardCard.deleted_at.is_(None),
                )
                .order_by(BoardCard.position.asc())
                .all()
            )
            sibling_cards.insert(target_position, card)
            for idx, c in enumerate(sibling_cards):
                c.position = idx
        else:
            # Moving to a different column
            # 1. Reorder old column
            old_siblings = (
                db.query(BoardCard)
                .filter(
                    BoardCard.column_id == card.column_id,
                    BoardCard.id != card.id,
                    BoardCard.deleted_at.is_(None),
                )
                .order_by(BoardCard.position.asc())
                .all()
            )
            for idx, c in enumerate(old_siblings):
                c.position = idx

            # 2. Insert into new column
            card.column_id = target_column_id
            new_siblings = (
                db.query(BoardCard)
                .filter(
                    BoardCard.column_id == target_column_id,
                    BoardCard.id != card.id,
                    BoardCard.deleted_at.is_(None),
                )
                .order_by(BoardCard.position.asc())
                .all()
            )
            new_siblings.insert(target_position, card)
            for idx, c in enumerate(new_siblings):
                c.position = idx

        db.commit()
        db.refresh(card)
        return cls._format_card_response(card)


project_service = ProjectService()
