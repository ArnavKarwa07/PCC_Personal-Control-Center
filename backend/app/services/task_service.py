"""Task management and recurrence engine business logic."""

import calendar
import math
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import List, Optional, Tuple, Union

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.tag import Tag
from app.models.task import RecurrencePattern, Task, TaskPriority, TaskRecurrence, TaskStatus
from app.schemas.task import (
    TaskCreate,
    TaskRecurrenceResponse,
    TaskResponse,
    TaskUpdate,
)


def calculate_next_occurrence(
    pattern: Union[RecurrencePattern, str],
    interval: int = 1,
    current_date: Optional[date] = None,
    days_of_week: Optional[str] = None,
    day_of_month: Optional[int] = None,
) -> date:
    """Calculate the next occurrence date for recurring tasks.

    Supports daily, weekly, monthly, yearly, and custom recurrence patterns.
    """
    if current_date is None:
        current_date = date.today()
    if interval < 1:
        interval = 1

    pattern_str = pattern.value if isinstance(pattern, RecurrencePattern) else str(pattern).lower()

    if pattern_str == "daily":
        return current_date + timedelta(days=interval)

    elif pattern_str == "weekly":
        if days_of_week:
            day_map = {
                "mon": 0,
                "mo": 0,
                "0": 0,
                "tue": 1,
                "tu": 1,
                "1": 1,
                "wed": 2,
                "we": 2,
                "2": 2,
                "thu": 3,
                "th": 3,
                "3": 3,
                "fri": 4,
                "fr": 4,
                "4": 4,
                "sat": 5,
                "sa": 5,
                "5": 5,
                "sun": 6,
                "su": 6,
                "6": 6,
            }
            parsed_days = []
            for part in days_of_week.split(","):
                cleaned = part.strip().lower()
                if cleaned in day_map:
                    parsed_days.append(day_map[cleaned])
                elif len(cleaned) >= 2 and cleaned[:2] in day_map:
                    parsed_days.append(day_map[cleaned[:2]])
                elif len(cleaned) >= 3 and cleaned[:3] in day_map:
                    parsed_days.append(day_map[cleaned[:3]])

            target_days = sorted(list(set(parsed_days)))
            if target_days:
                current_weekday = current_date.weekday()
                for d in target_days:
                    if d > current_weekday:
                        return current_date + timedelta(days=(d - current_weekday))
                days_until_next_week = (7 - current_weekday) + target_days[0] + (interval - 1) * 7
                return current_date + timedelta(days=days_until_next_week)

        return current_date + timedelta(weeks=interval)

    elif pattern_str == "monthly":
        target_day = day_of_month if day_of_month is not None else current_date.day
        year = current_date.year
        month = current_date.month + interval
        year += (month - 1) // 12
        month = ((month - 1) % 12) + 1
        _, max_days = calendar.monthrange(year, month)
        actual_day = min(target_day, max_days)
        return date(year, month, actual_day)

    elif pattern_str == "yearly":
        year = current_date.year + interval
        month = current_date.month
        target_day = day_of_month if day_of_month is not None else current_date.day
        _, max_days = calendar.monthrange(year, month)
        actual_day = min(target_day, max_days)
        return date(year, month, actual_day)

    elif pattern_str == "custom":
        return current_date + timedelta(days=interval)

    else:
        return current_date + timedelta(days=interval)


class TaskService:
    """Service providing CRUD, recurrence, and lifecycle operations for user tasks."""

    @staticmethod
    def _format_task_response(task: Task) -> TaskResponse:
        """Convert a Task model instance into a TaskResponse with tag names and recurrence."""
        tag_names = [t.name for t in (task.tags or []) if t.deleted_at is None]
        recurrence_resp = None
        if task.recurrence and task.recurrence.deleted_at is None:
            recurrence_resp = TaskRecurrenceResponse(
                id=task.recurrence.id,
                task_id=task.recurrence.task_id,
                pattern=task.recurrence.pattern,
                interval=task.recurrence.interval,
                days_of_week=task.recurrence.days_of_week,
                day_of_month=task.recurrence.day_of_month,
                end_date=task.recurrence.end_date,
                max_occurrences=task.recurrence.max_occurrences,
                next_occurrence=task.recurrence.next_occurrence,
            )

        return TaskResponse(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            priority=task.priority,
            due_date=task.due_date,
            due_time=task.due_time,
            reminder_at=task.reminder_at,
            project_id=task.project_id,
            goal_id=task.goal_id,
            estimated_minutes=task.estimated_minutes,
            actual_minutes=task.actual_minutes,
            completed_at=task.completed_at,
            created_at=task.created_at,
            updated_at=task.updated_at,
            tags=tag_names,
            recurrence=recurrence_resp,
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

    @classmethod
    def handle_recurrence_completion(cls, db: Session, task: Task) -> Optional[Task]:
        """Generate next recurring task instance when current task is marked done."""
        recurrence = (
            db.query(TaskRecurrence)
            .filter(
                TaskRecurrence.task_id == task.id,
                TaskRecurrence.deleted_at.is_(None),
            )
            .first()
        )
        if not recurrence:
            return None

        base_date = task.due_date if task.due_date else date.today()
        next_due_date = calculate_next_occurrence(
            pattern=recurrence.pattern,
            interval=recurrence.interval,
            current_date=base_date,
            days_of_week=recurrence.days_of_week,
            day_of_month=recurrence.day_of_month,
        )

        if recurrence.end_date and next_due_date > recurrence.end_date:
            return None

        # Create next task instance
        next_task = Task(
            title=task.title,
            description=task.description,
            status=TaskStatus.TODO,
            priority=task.priority,
            due_date=next_due_date,
            due_time=task.due_time,
            project_id=task.project_id,
            goal_id=task.goal_id,
            estimated_minutes=task.estimated_minutes,
        )
        if task.tags:
            next_task.tags = list(task.tags)

        db.add(next_task)
        db.flush()

        # Create recurrence config on the new task instance
        next_next_date = calculate_next_occurrence(
            pattern=recurrence.pattern,
            interval=recurrence.interval,
            current_date=next_due_date,
            days_of_week=recurrence.days_of_week,
            day_of_month=recurrence.day_of_month,
        )
        new_recurrence = TaskRecurrence(
            task_id=next_task.id,
            pattern=recurrence.pattern,
            interval=recurrence.interval,
            days_of_week=recurrence.days_of_week,
            day_of_month=recurrence.day_of_month,
            end_date=recurrence.end_date,
            max_occurrences=recurrence.max_occurrences,
            next_occurrence=next_next_date,
        )
        db.add(new_recurrence)
        db.flush()

        return next_task

    @classmethod
    def list_tasks(
        cls,
        db: Session,
        status: Optional[TaskStatus] = None,
        priority: Optional[TaskPriority] = None,
        project_id: Optional[uuid.UUID] = None,
        due_before: Optional[date] = None,
        due_after: Optional[date] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[TaskResponse], int, int]:
        """List tasks with optional filtering and pagination."""
        query = db.query(Task).filter(
            Task.deleted_at.is_(None),
        )

        if status is not None:
            query = query.filter(Task.status == status)
        if priority is not None:
            query = query.filter(Task.priority == priority)
        if project_id is not None:
            query = query.filter(Task.project_id == project_id)
        if due_before is not None:
            query = query.filter(Task.due_date <= due_before)
        if due_after is not None:
            query = query.filter(Task.due_date >= due_after)

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        tasks = (
            query.order_by(Task.due_date.asc().nullslast(), Task.created_at.desc()).offset(offset).limit(per_page).all()
        )

        formatted_tasks = [cls._format_task_response(task) for task in tasks]
        return formatted_tasks, total, total_pages

    @classmethod
    def create_task(cls, db: Session, data: TaskCreate) -> TaskResponse:
        """Create a new task."""
        task_data = data.model_dump(exclude={"tags", "recurrence"})
        task = Task(**task_data)

        if data.tags:
            task.tags = cls._get_or_create_tags(db, data.tags)

        if task.status == TaskStatus.DONE and task.completed_at is None:
            task.completed_at = datetime.now(timezone.utc)

        db.add(task)
        db.flush()

        if data.recurrence:
            base_date = task.due_date if task.due_date else date.today()
            next_date = calculate_next_occurrence(
                pattern=data.recurrence.pattern,
                interval=data.recurrence.interval or 1,
                current_date=base_date,
                days_of_week=data.recurrence.days_of_week,
                day_of_month=data.recurrence.day_of_month,
            )
            recurrence = TaskRecurrence(
                task_id=task.id,
                pattern=data.recurrence.pattern,
                interval=data.recurrence.interval or 1,
                days_of_week=data.recurrence.days_of_week,
                day_of_month=data.recurrence.day_of_month,
                end_date=data.recurrence.end_date,
                max_occurrences=data.recurrence.max_occurrences,
                next_occurrence=next_date,
            )
            db.add(recurrence)
            db.flush()

        if task.status == TaskStatus.DONE:
            cls.handle_recurrence_completion(db, task)

        db.commit()
        db.refresh(task)
        return cls._format_task_response(task)

    @classmethod
    def get_task(cls, db: Session, task_id: uuid.UUID) -> Task:
        """Retrieve task by ID enforcing soft deletion check."""
        task = (
            db.query(Task)
            .filter(
                Task.id == task_id,
                Task.deleted_at.is_(None),
            )
            .first()
        )
        if not task:
            raise NotFoundException(message="Task not found", code="TASK_NOT_FOUND")
        return task

    @classmethod
    def get_task_response(cls, db: Session, task_id: uuid.UUID) -> TaskResponse:
        """Retrieve task and return formatted TaskResponse."""
        task = cls.get_task(db, task_id)
        return cls._format_task_response(task)

    @classmethod
    def update_task(cls, db: Session, task_id: uuid.UUID, data: TaskUpdate) -> TaskResponse:
        """Update fields of an existing task and trigger recurrence if marked done."""
        task = cls.get_task(db, task_id)
        update_data = data.model_dump(exclude_unset=True, exclude={"tags", "recurrence"})

        was_not_done = task.status != TaskStatus.DONE

        if "status" in update_data:
            new_status = update_data["status"]
            if new_status == TaskStatus.DONE and was_not_done:
                task.completed_at = datetime.now(timezone.utc)
            elif new_status != TaskStatus.DONE and not was_not_done:
                task.completed_at = None

        for field, value in update_data.items():
            setattr(task, field, value)

        if data.tags is not None:
            task.tags = cls._get_or_create_tags(db, data.tags)

        if data.recurrence is not None:
            existing_rec = (
                db.query(TaskRecurrence)
                .filter(TaskRecurrence.task_id == task.id, TaskRecurrence.deleted_at.is_(None))
                .first()
            )
            base_date = task.due_date if task.due_date else date.today()
            next_date = calculate_next_occurrence(
                pattern=data.recurrence.pattern,
                interval=data.recurrence.interval or 1,
                current_date=base_date,
                days_of_week=data.recurrence.days_of_week,
                day_of_month=data.recurrence.day_of_month,
            )
            if existing_rec:
                existing_rec.pattern = data.recurrence.pattern
                existing_rec.interval = data.recurrence.interval or 1
                existing_rec.days_of_week = data.recurrence.days_of_week
                existing_rec.day_of_month = data.recurrence.day_of_month
                existing_rec.end_date = data.recurrence.end_date
                existing_rec.max_occurrences = data.recurrence.max_occurrences
                existing_rec.next_occurrence = next_date
            else:
                new_rec = TaskRecurrence(
                    task_id=task.id,
                    pattern=data.recurrence.pattern,
                    interval=data.recurrence.interval or 1,
                    days_of_week=data.recurrence.days_of_week,
                    day_of_month=data.recurrence.day_of_month,
                    end_date=data.recurrence.end_date,
                    max_occurrences=data.recurrence.max_occurrences,
                    next_occurrence=next_date,
                )
                db.add(new_rec)

        db.flush()

        # If transition to DONE just happened, create next occurrence
        if task.status == TaskStatus.DONE and was_not_done:
            cls.handle_recurrence_completion(db, task)

        db.commit()
        db.refresh(task)
        return cls._format_task_response(task)

    @classmethod
    def delete_task(cls, db: Session, task_id: uuid.UUID) -> None:
        """Soft delete a task by setting its deleted_at timestamp."""
        task = cls.get_task(db, task_id)
        task.deleted_at = datetime.now(timezone.utc)
        db.commit()


task_service = TaskService()
