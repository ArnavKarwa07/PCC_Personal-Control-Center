"""Note management business logic."""

import math
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundException
from app.models.note import Note
from app.schemas.note import NoteCreate, NoteResponse, NoteUpdate


class NoteService:
    """Service providing CRUD and pinning operations for user notes."""

    @staticmethod
    def _format_note_response(note: Note) -> NoteResponse:
        """Convert Note model instance into NoteResponse schema."""
        return NoteResponse(
            id=note.id,
            title=note.title,
            content=note.content,
            category=note.category,
            is_pinned=note.is_pinned,
            created_at=note.created_at,
            updated_at=note.updated_at,
        )

    @classmethod
    def list_notes(
        cls,
        db: Session,
        is_pinned: Optional[bool] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[NoteResponse], int, int]:
        """List notes with optional filtering and pagination."""
        query = db.query(Note).filter(
            Note.deleted_at.is_(None),
        )

        if is_pinned is not None:
            query = query.filter(Note.is_pinned == is_pinned)
        if category:
            query = query.filter(Note.category == category)
        if search:
            query = query.filter(
                (Note.title.ilike(f"%{search}%")) | (Note.content.ilike(f"%{search}%"))
            )

        total = query.count()
        total_pages = max(1, math.ceil(total / per_page)) if total > 0 else 1

        offset = (page - 1) * per_page
        notes = (
            query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())
            .offset(offset)
            .limit(per_page)
            .all()
        )

        formatted_notes = [cls._format_note_response(n) for n in notes]
        return formatted_notes, total, total_pages

    @classmethod
    def create_note(cls, db: Session, data: NoteCreate) -> NoteResponse:
        """Create a new note."""
        note = Note(
            title=data.title,
            content=data.content,
            category=data.category,
            is_pinned=data.is_pinned or False,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        return cls._format_note_response(note)

    @classmethod
    def get_note(cls, db: Session, note_id: uuid.UUID) -> Note:
        """Retrieve a note by ID enforcing soft deletion check."""
        note = (
            db.query(Note)
            .filter(
                Note.id == note_id,
                Note.deleted_at.is_(None),
            )
            .first()
        )
        if not note:
            raise NotFoundException(message="Note not found", code="NOTE_NOT_FOUND")
        return note

    @classmethod
    def get_note_response(cls, db: Session, note_id: uuid.UUID) -> NoteResponse:
        """Retrieve note and return formatted NoteResponse."""
        note = cls.get_note(db, note_id)
        return cls._format_note_response(note)

    @classmethod
    def update_note(cls, db: Session, note_id: uuid.UUID, data: NoteUpdate) -> NoteResponse:
        """Update fields of an existing note."""
        note = cls.get_note(db, note_id)
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            setattr(note, field, value)

        db.commit()
        db.refresh(note)
        return cls._format_note_response(note)

    @classmethod
    def toggle_pin(cls, db: Session, note_id: uuid.UUID, is_pinned: Optional[bool] = None) -> NoteResponse:
        """Toggle or set pinned state of a note."""
        note = cls.get_note(db, note_id)
        if is_pinned is not None:
            note.is_pinned = is_pinned
        else:
            note.is_pinned = not note.is_pinned

        db.commit()
        db.refresh(note)
        return cls._format_note_response(note)

    @classmethod
    def delete_note(cls, db: Session, note_id: uuid.UUID) -> None:
        """Soft delete a note."""
        note = cls.get_note(db, note_id)
        note.deleted_at = datetime.now(timezone.utc)
        db.commit()


note_service = NoteService()
