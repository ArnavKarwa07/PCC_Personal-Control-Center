"""Kanban Boards, Columns, and Cards REST API endpoints."""

import uuid

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas.project import (
    BoardCardCreate,
    BoardCardMove,
    BoardColumnCreate,
    BoardCreate,
)
from app.services.project_service import project_service

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.post("/create_board", operation_id="create_board", status_code=status.HTTP_201_CREATED, summary="Create Board")
def create_board(
    data: BoardCreate,
    db: Session = Depends(get_db),
):
    """Create a new standalone or project Kanban board."""
    board = project_service.create_board(db=db, data=data)
    return {
        "data": board.model_dump(),
    }


@router.get("/get_board_by_id/{board_id}", operation_id="get_board_by_id", summary="Get Board By Id")
def get_board(
    board_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    """Retrieve Kanban board by ID with its columns and cards."""
    board = project_service.get_board(db=db, board_id=board_id)
    return {
        "data": board.model_dump(),
    }


@router.post("/create_board_column/{board_id}", operation_id="create_board_column", status_code=status.HTTP_201_CREATED, summary="Create Board Column")
def create_column(
    board_id: uuid.UUID,
    data: BoardColumnCreate,
    db: Session = Depends(get_db),
):
    """Add a new column to a Kanban board."""
    column = project_service.create_column(
        db=db,
        board_id=board_id,
        data=data,
    )
    return {
        "data": column.model_dump(),
    }


@router.post("/create_board_card", operation_id="create_board_card", status_code=status.HTTP_201_CREATED, summary="Create Board Card")
def create_card(
    data: BoardCardCreate,
    db: Session = Depends(get_db),
):
    """Place a task card in a board column."""
    card = project_service.create_card(db=db, data=data)
    return {
        "data": card.model_dump(),
    }


@router.patch("/move_board_card_by_id/{card_id}", operation_id="move_board_card_by_id", summary="Move Board Card By Id")
def move_card(
    card_id: uuid.UUID,
    data: BoardCardMove,
    db: Session = Depends(get_db),
):
    """Move a card to a new column and/or position."""
    card = project_service.move_card(
        db=db,
        card_id=card_id,
        data=data,
    )
    return {
        "data": card.model_dump(),
    }
