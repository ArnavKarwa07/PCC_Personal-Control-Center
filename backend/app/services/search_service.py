"""Global search service aggregating cross-entity SQLite LIKE queries with relevance scoring."""

import re
import uuid
from typing import Any, Dict, List, Optional, Set

from sqlalchemy.orm import Session

from app.models.calendar_event import CalendarEvent
from app.models.contact import Contact
from app.models.goal import Goal
from app.models.idea import Idea
from app.models.note import Note
from app.models.project import Project
from app.models.reminder import Reminder
from app.models.task import Task
from app.schemas.search import SearchMeta, SearchResponse, SearchResultItem

# Supported entity types canonical names
SUPPORTED_ENTITY_TYPES = {
    "tasks",
    "projects",
    "notes",
    "ideas",
    "calendar_events",
    "contacts",
    "goals",
    "reminders",
    "career",
    "reviews",
}

# Type aliases mapping for flexible query parameters
TYPE_ALIASES = {
    "task": "tasks",
    "tasks": "tasks",
    "project": "projects",
    "projects": "projects",
    "note": "notes",
    "notes": "notes",
    "idea": "ideas",
    "ideas": "ideas",
    "calendar": "calendar_events",
    "calendar_event": "calendar_events",
    "calendar_events": "calendar_events",
    "events": "calendar_events",
    "contact": "contacts",
    "contacts": "contacts",
    "goal": "goals",
    "goals": "goals",
    "reminder": "reminders",
    "reminders": "reminders",
    "career": "career",
    "achievements": "career",
    "skills": "career",
    "review": "reviews",
    "reviews": "reviews",
}


class SearchService:
    """Service executing cross-entity searches with relevance scoring and snippet extraction."""

    @staticmethod
    def _escape_like(text: str) -> str:
        """Escape special SQL LIKE characters (% and _)."""
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")

    @staticmethod
    def _clean_text(text: Optional[str]) -> str:
        """Strip and normalize consecutive whitespace."""
        if not text:
            return ""
        return re.sub(r"\s+", " ", text).strip()

    @classmethod
    def _create_snippet(cls, query: str, text: Optional[str], max_chars: int = 150) -> Optional[str]:
        """Extract contextual snippet surrounding matched search query."""
        if not text:
            return None

        clean = cls._clean_text(text)
        if not clean:
            return None

        if len(clean) <= max_chars:
            return clean

        q_lower = query.lower()
        text_lower = clean.lower()
        idx = text_lower.find(q_lower)

        if idx != -1:
            start = max(0, idx - 45)
            end = min(len(clean), idx + len(query) + 85)
            snippet = clean[start:end].strip()
            if start > 0:
                snippet = "..." + snippet
            if end < len(clean):
                snippet = snippet + "..."
            return snippet

        return clean[:max_chars].strip() + "..."

    @classmethod
    def _compute_relevance(
        cls,
        query: str,
        title: str,
        body: Optional[str] = None,
        metadata_text: Optional[str] = None,
    ) -> float:
        """Compute relevance score (0.0 - 1.0) based on match specificity and location."""
        q_norm = query.strip().lower()
        title_norm = (title or "").strip().lower()
        body_norm = cls._clean_text(body).lower()
        meta_norm = cls._clean_text(metadata_text).lower()

        if title_norm == q_norm:
            return 1.0
        if title_norm.startswith(q_norm):
            return 0.95
        if q_norm in title_norm:
            return 0.85
        if body_norm.startswith(q_norm):
            return 0.70
        if q_norm in body_norm:
            return 0.55
        if meta_norm and q_norm in meta_norm:
            return 0.40
        return 0.30

    @classmethod
    def _parse_types(cls, types_param: Optional[str]) -> Set[str]:
        """Parse comma-separated types parameter into normalized canonical entity names."""
        if not types_param:
            return set(SUPPORTED_ENTITY_TYPES)

        selected: Set[str] = set()
        for raw_t in types_param.split(","):
            cleaned = raw_t.strip().lower()
            if cleaned in TYPE_ALIASES:
                selected.add(TYPE_ALIASES[cleaned])
        return selected if selected else set(SUPPORTED_ENTITY_TYPES)

    @classmethod
    def _search_tasks(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search tasks table."""
        pattern = f"%{cls._escape_like(q)}%"
        tasks = (
            db.query(Task)
            .filter(
                Task.user_id == user_id,
                Task.deleted_at.is_(None),
                (Task.title.ilike(pattern, escape="\\")) | (Task.description.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for task in tasks:
            status_val = task.status.value if hasattr(task.status, "value") else str(task.status)
            priority_val = task.priority.value if hasattr(task.priority, "value") else str(task.priority)
            metadata: Dict[str, Any] = {
                "status": status_val,
                "priority": priority_val,
                "due_date": task.due_date.isoformat() if task.due_date else None,
                "project_id": str(task.project_id) if task.project_id else None,
            }
            meta_text = f"{status_val} {priority_val}"
            snippet = cls._create_snippet(q, task.description)
            rel = cls._compute_relevance(q, task.title, task.description, meta_text)

            results.append(
                SearchResultItem(
                    id=str(task.id),
                    entity_type="task",
                    title=task.title,
                    snippet=snippet,
                    relevance=rel,
                    url=f"/tasks/{task.id}",
                    metadata=metadata,
                    created_at=task.created_at,
                    updated_at=task.updated_at,
                )
            )
        return results

    @classmethod
    def _search_projects(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search projects table."""
        pattern = f"%{cls._escape_like(q)}%"
        projects = (
            db.query(Project)
            .filter(
                Project.user_id == user_id,
                Project.deleted_at.is_(None),
                (Project.name.ilike(pattern, escape="\\")) | (Project.description.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for proj in projects:
            status_val = proj.status.value if hasattr(proj.status, "value") else str(proj.status)
            priority_val = proj.priority.value if hasattr(proj.priority, "value") else str(proj.priority)
            metadata: Dict[str, Any] = {
                "status": status_val,
                "priority": priority_val,
                "progress": proj.progress,
                "deadline": proj.deadline.isoformat() if proj.deadline else None,
            }
            meta_text = f"{status_val} {priority_val}"
            snippet = cls._create_snippet(q, proj.description)
            rel = cls._compute_relevance(q, proj.name, proj.description, meta_text)

            results.append(
                SearchResultItem(
                    id=str(proj.id),
                    entity_type="project",
                    title=proj.name,
                    snippet=snippet,
                    relevance=rel,
                    url=f"/projects/{proj.id}",
                    metadata=metadata,
                    created_at=proj.created_at,
                    updated_at=proj.updated_at,
                )
            )
        return results

    @classmethod
    def _search_notes(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search notes table."""
        pattern = f"%{cls._escape_like(q)}%"
        notes = (
            db.query(Note)
            .filter(
                Note.user_id == user_id,
                Note.deleted_at.is_(None),
                (Note.title.ilike(pattern, escape="\\"))
                | (Note.content.ilike(pattern, escape="\\"))
                | (Note.category.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for note in notes:
            display_title = note.title or "Untitled Note"
            metadata: Dict[str, Any] = {
                "category": note.category,
                "is_pinned": note.is_pinned,
            }
            snippet = cls._create_snippet(q, note.content)
            rel = cls._compute_relevance(q, display_title, note.content, note.category)

            results.append(
                SearchResultItem(
                    id=str(note.id),
                    entity_type="note",
                    title=display_title,
                    snippet=snippet,
                    relevance=rel,
                    url="/notes",
                    metadata=metadata,
                    created_at=note.created_at,
                    updated_at=note.updated_at,
                )
            )
        return results

    @classmethod
    def _search_ideas(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search ideas table."""
        pattern = f"%{cls._escape_like(q)}%"
        ideas = (
            db.query(Idea)
            .filter(
                Idea.user_id == user_id,
                Idea.deleted_at.is_(None),
                (Idea.title.ilike(pattern, escape="\\"))
                | (Idea.description.ilike(pattern, escape="\\"))
                | (Idea.category.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for idea in ideas:
            status_val = idea.status.value if hasattr(idea.status, "value") else str(idea.status)
            metadata: Dict[str, Any] = {
                "category": idea.category,
                "status": status_val,
                "promoted_to_type": idea.promoted_to_type,
            }
            snippet = cls._create_snippet(q, idea.description)
            rel = cls._compute_relevance(q, idea.title, idea.description, f"{idea.category} {status_val}")

            results.append(
                SearchResultItem(
                    id=str(idea.id),
                    entity_type="idea",
                    title=idea.title,
                    snippet=snippet,
                    relevance=rel,
                    url="/ideas",
                    metadata=metadata,
                    created_at=idea.created_at,
                    updated_at=idea.updated_at,
                )
            )
        return results

    @classmethod
    def _search_calendar_events(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search calendar events table."""
        pattern = f"%{cls._escape_like(q)}%"
        events = (
            db.query(CalendarEvent)
            .filter(
                CalendarEvent.user_id == user_id,
                CalendarEvent.deleted_at.is_(None),
                (CalendarEvent.title.ilike(pattern, escape="\\"))
                | (CalendarEvent.description.ilike(pattern, escape="\\"))
                | (CalendarEvent.location.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for ev in events:
            ev_type = ev.event_type.value if hasattr(ev.event_type, "value") else str(ev.event_type)
            metadata: Dict[str, Any] = {
                "event_type": ev_type,
                "start_time": ev.start_time.isoformat() if ev.start_time else None,
                "end_time": ev.end_time.isoformat() if ev.end_time else None,
                "location": ev.location,
                "all_day": ev.all_day,
            }
            body = f"{ev.description or ''} {ev.location or ''}".strip()
            snippet = cls._create_snippet(q, body or ev.location or ev.description)
            rel = cls._compute_relevance(q, ev.title, body, f"{ev_type} {ev.location}")

            results.append(
                SearchResultItem(
                    id=str(ev.id),
                    entity_type="calendar_event",
                    title=ev.title,
                    snippet=snippet,
                    relevance=rel,
                    url="/calendar",
                    metadata=metadata,
                    created_at=ev.created_at,
                    updated_at=ev.updated_at,
                )
            )
        return results

    @classmethod
    def _search_contacts(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search contacts CRM table."""
        pattern = f"%{cls._escape_like(q)}%"
        contacts = (
            db.query(Contact)
            .filter(
                Contact.user_id == user_id,
                Contact.deleted_at.is_(None),
                (Contact.name.ilike(pattern, escape="\\"))
                | (Contact.organization.ilike(pattern, escape="\\"))
                | (Contact.role.ilike(pattern, escape="\\"))
                | (Contact.email.ilike(pattern, escape="\\"))
                | (Contact.notes.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for c in contacts:
            metadata: Dict[str, Any] = {
                "organization": c.organization,
                "role": c.role,
                "email": c.email,
                "phone": c.phone,
            }
            meta_details = f"{c.role or ''} {c.organization or ''} {c.email or ''}".strip()
            snippet = cls._create_snippet(q, c.notes or meta_details)
            rel = cls._compute_relevance(q, c.name, c.notes, meta_details)

            results.append(
                SearchResultItem(
                    id=str(c.id),
                    entity_type="contact",
                    title=c.name,
                    snippet=snippet,
                    relevance=rel,
                    url="/contacts",
                    metadata=metadata,
                    created_at=c.created_at,
                    updated_at=c.updated_at,
                )
            )
        return results

    @classmethod
    def _search_goals(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search goals table."""
        pattern = f"%{cls._escape_like(q)}%"
        goals = (
            db.query(Goal)
            .filter(
                Goal.user_id == user_id,
                Goal.deleted_at.is_(None),
                (Goal.name.ilike(pattern, escape="\\")) | (Goal.description.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for g in goals:
            status_val = g.status.value if hasattr(g.status, "value") else str(g.status)
            metadata: Dict[str, Any] = {
                "status": status_val,
                "progress": g.progress,
                "time_period": g.time_period,
            }
            snippet = cls._create_snippet(q, g.description)
            rel = cls._compute_relevance(q, g.name, g.description, f"{status_val} {g.time_period}")

            results.append(
                SearchResultItem(
                    id=str(g.id),
                    entity_type="goal",
                    title=g.name,
                    snippet=snippet,
                    relevance=rel,
                    url="/goals",
                    metadata=metadata,
                    created_at=g.created_at,
                    updated_at=g.updated_at,
                )
            )
        return results

    @classmethod
    def _search_reminders(cls, db: Session, user_id: uuid.UUID, q: str) -> List[SearchResultItem]:
        """Search reminders table."""
        pattern = f"%{cls._escape_like(q)}%"
        reminders = (
            db.query(Reminder)
            .filter(
                Reminder.user_id == user_id,
                Reminder.deleted_at.is_(None),
                (Reminder.title.ilike(pattern, escape="\\")) | (Reminder.description.ilike(pattern, escape="\\")),
            )
            .all()
        )

        results = []
        for rem in reminders:
            status_val = rem.status.value if hasattr(rem.status, "value") else str(rem.status)
            metadata: Dict[str, Any] = {
                "status": status_val,
                "remind_at": rem.remind_at.isoformat() if rem.remind_at else None,
                "is_recurring": rem.is_recurring,
            }
            snippet = cls._create_snippet(q, rem.description)
            rel = cls._compute_relevance(q, rem.title, rem.description, status_val)

            results.append(
                SearchResultItem(
                    id=str(rem.id),
                    entity_type="reminder",
                    title=rem.title,
                    snippet=snippet,
                    relevance=rel,
                    url="/reminders",
                    metadata=metadata,
                    created_at=rem.created_at,
                    updated_at=rem.updated_at,
                )
            )
        return results

    @classmethod
    def search(
        cls,
        db: Session,
        user_id: uuid.UUID,
        q: str,
        types: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> SearchResponse:
        """Execute cross-entity search and return aggregated typed results."""
        clean_q = q.strip()
        if not clean_q:
            return SearchResponse(
                data=[],
                meta=SearchMeta(
                    query="",
                    total=0,
                    types_searched=[],
                    counts_by_type={},
                    limit=limit,
                    offset=offset,
                ),
            )

        active_types = cls._parse_types(types)
        all_results: List[SearchResultItem] = []
        counts_by_type: Dict[str, int] = {}

        # Search across requested entity types
        if "tasks" in active_types:
            tasks_res = cls._search_tasks(db, user_id, clean_q)
            counts_by_type["tasks"] = len(tasks_res)
            all_results.extend(tasks_res)

        if "projects" in active_types:
            projects_res = cls._search_projects(db, user_id, clean_q)
            counts_by_type["projects"] = len(projects_res)
            all_results.extend(projects_res)

        if "notes" in active_types:
            notes_res = cls._search_notes(db, user_id, clean_q)
            counts_by_type["notes"] = len(notes_res)
            all_results.extend(notes_res)

        if "ideas" in active_types:
            ideas_res = cls._search_ideas(db, user_id, clean_q)
            counts_by_type["ideas"] = len(ideas_res)
            all_results.extend(ideas_res)

        if "calendar_events" in active_types:
            cal_res = cls._search_calendar_events(db, user_id, clean_q)
            counts_by_type["calendar_events"] = len(cal_res)
            all_results.extend(cal_res)

        if "contacts" in active_types:
            contacts_res = cls._search_contacts(db, user_id, clean_q)
            counts_by_type["contacts"] = len(contacts_res)
            all_results.extend(contacts_res)

        if "goals" in active_types:
            goals_res = cls._search_goals(db, user_id, clean_q)
            counts_by_type["goals"] = len(goals_res)
            all_results.extend(goals_res)

        if "reminders" in active_types:
            reminders_res = cls._search_reminders(db, user_id, clean_q)
            counts_by_type["reminders"] = len(reminders_res)
            all_results.extend(reminders_res)

        # Sort combined results by relevance desc, then updated_at / created_at desc
        all_results.sort(
            key=lambda item: (
                item.relevance,
                item.updated_at.timestamp() if item.updated_at else 0,
                item.created_at.timestamp() if item.created_at else 0,
            ),
            reverse=True,
        )

        total = len(all_results)
        paginated_data = all_results[offset : offset + limit]

        return SearchResponse(
            data=paginated_data,
            meta=SearchMeta(
                query=clean_q,
                total=total,
                types_searched=sorted(list(active_types)),
                counts_by_type=counts_by_type,
                limit=limit,
                offset=offset,
            ),
        )


search_service = SearchService()
