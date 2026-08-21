"""AI Executive Assistant REST API endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.assistant import AssistantQueryRequest, AssistantQueryResponse, DailyBriefingRead
from app.services.assistant_service import assistant_service

router = APIRouter(prefix="/assistant", tags=["AI Executive Assistant"])


@router.post("/process_assistant_query", operation_id="process_assistant_query", response_model=AssistantQueryResponse, summary="Process Assistant Query")
def process_assistant_query(
    request: AssistantQueryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Process natural language request and dispatch autonomous actions or queries."""
    return assistant_service.process_query(db=db, user_id=current_user.id, request=request)


@router.get("/get_daily_briefing", operation_id="get_daily_briefing", response_model=DailyBriefingRead, summary="Get Daily Briefing")
def get_daily_briefing(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate synthesized daily briefing and priority focus recommendations."""
    return assistant_service.generate_daily_briefing(db=db, user_id=current_user.id)
