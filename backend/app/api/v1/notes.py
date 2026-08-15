"""Note management REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.note import NoteCreate, NoteUpdate
from app.services.note_service import note_service

router = APIRouter(prefix="/notes", tags=["Notes"])


@router.get("", summary="List Notes")
def list_notes(
    is_pinned: Optional[bool] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve paginated notes with optional pin and category filters."""
    notes, total, total_pages = note_service.list_notes(
        db=db,
        user_id=current_user.id,
        is_pinned=is_pinned,
        category=category,
        search=search,
        page=page,
        per_page=per_page,
    )
    return {
        "data": [n.model_dump() for n in notes],
        "meta": {
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
        },
    }


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Note")
def create_note(
    data: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new note under authenticated user."""
    note = note_service.create_note(db=db, user_id=current_user.id, data=data)
    return {
        "data": note.model_dump(),
    }


@router.get("/{note_id}")
def get_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve a single note by ID."""
    note = note_service.get_note_response(db=db, user_id=current_user.id, note_id=note_id)
    return {
        "data": note.model_dump(),
    }


@router.patch("/{note_id}")
def update_note(
    note_id: uuid.UUID,
    data: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update note details."""
    note = note_service.update_note(
        db=db,
        user_id=current_user.id,
        note_id=note_id,
        data=data,
    )
    return {
        "data": note.model_dump(),
    }


@router.patch("/{note_id}/pin")
def toggle_note_pin(
    note_id: uuid.UUID,
    is_pinned: Optional[bool] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Toggle or explicitly set pinned status of a note."""
    note = note_service.toggle_pin(
        db=db,
        user_id=current_user.id,
        note_id=note_id,
        is_pinned=is_pinned,
    )
    return {
        "data": note.model_dump(),
    }


@router.delete("/{note_id}")
def delete_note(
    note_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Soft delete a note."""
    note_service.delete_note(db=db, user_id=current_user.id, note_id=note_id)
    return {
        "data": {
            "message": "Note deleted successfully.",
        }
    }
