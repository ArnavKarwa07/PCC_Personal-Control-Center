"""Board, BoardColumn, and BoardCard models for Kanban boards."""

from sqlalchemy import Column, ForeignKey, Integer, String, Uuid
from sqlalchemy.orm import relationship

from app.models.base import BaseModel


class Board(BaseModel):
    """Kanban Board entity."""

    __tablename__ = "boards"

    project_id = Column(Uuid(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=True, index=True)
    name = Column(String(255), nullable=False)

    project = relationship("Project", back_populates="boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan", order_by="BoardColumn.position")


class BoardColumn(BaseModel):
    """Column within a Kanban board."""

    __tablename__ = "board_columns"

    board_id = Column(Uuid(as_uuid=True), ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=False, default=0)
    color = Column(String(20), nullable=True)

    board = relationship("Board", back_populates="columns")
    cards = relationship("BoardCard", back_populates="column", cascade="all, delete-orphan", order_by="BoardCard.position")


class BoardCard(BaseModel):
    """Card placement representing a task inside a board column."""

    __tablename__ = "board_cards"

    column_id = Column(Uuid(as_uuid=True), ForeignKey("board_columns.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id = Column(Uuid(as_uuid=True), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    position = Column(Integer, nullable=False, default=0)

    column = relationship("BoardColumn", back_populates="cards")
    task = relationship("Task")
