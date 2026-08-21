"""Global Search REST API endpoint for cross-entity discovery."""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.search import SearchResponse
from app.services.search_service import search_service

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/search_entities", operation_id="search_entities", response_model=SearchResponse, summary="Search Entities")
def search(
    q: str = Query(..., min_length=1, description="Search query string"),
    types: Optional[str] = Query(
        None,
        description="Comma-separated entity types (e.g. tasks,projects,notes,ideas,calendar,contacts,goals,reminders)",
    ),
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results to return"),
    offset: int = Query(0, ge=0, description="Offset for paginated results"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> SearchResponse:
    """Execute full-text cross-entity search across tasks, projects, notes, ideas, calendar, contacts, goals, and reminders."""
    return search_service.search(
        db=db,
        user_id=current_user.id,
        q=q,
        types=types,
        limit=limit,
        offset=offset,
    )
