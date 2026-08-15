"""Kanban Boards, Columns, and Cards REST API endpoints."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.project import (
    BoardCardCreate,
    BoardCardMove,
    BoardColumnCreate,
    BoardCreate,
)
from app.services.project_service import project_service

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.post("", status_code=status.HTTP_201_CREATED, summary="Create Board")
def create_board(
    data: BoardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new standalone or project Kanban board."""
    board = project_service.create_board(db=db, user_id=current_user.id, data=data)
    return {
        "data": board.model_dump(),
    }


@router.get("/{board_id}")
def get_board(
    board_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve Kanban board by ID with its columns and cards."""
    board = project_service.get_board(db=db, user_id=current_user.id, board_id=board_id)
    return {
        "data": board.model_dump(),
    }


@router.post("/{board_id}/columns", status_code=status.HTTP_201_CREATED)
def create_column(
    board_id: uuid.UUID,
    data: BoardColumnCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a new column to a Kanban board."""
    column = project_service.create_column(
        db=db,
        user_id=current_user.id,
        board_id=board_id,
        data=data,
    )
    return {
        "data": column.model_dump(),
    }


@router.post("/cards", status_code=status.HTTP_201_CREATED)
def create_card(
    data: BoardCardCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Place a task card in a board column."""
    card = project_service.create_card(db=db, user_id=current_user.id, data=data)
    return {
        "data": card.model_dump(),
    }


@router.patch("/cards/{card_id}/move")
def move_card(
    card_id: uuid.UUID,
    data: BoardCardMove,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Move a card to a new column and/or position."""
    card = project_service.move_card(
        db=db,
        user_id=current_user.id,
        card_id=card_id,
        data=data,
    )
    return {
        "data": card.model_dump(),
    }
