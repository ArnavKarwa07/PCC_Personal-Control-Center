"""Note Pydantic schemas for markdown notes and knowledge management."""

import uuid
from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.base import PaginationMeta


class NoteBase(BaseModel):
    """Base note attributes."""

    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    is_pinned: Optional[bool] = Field(False, strict=True)


class NoteCreate(BaseModel):
    """Payload for creating a new note."""

    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    is_pinned: Optional[bool] = Field(False, strict=True)


class NoteUpdate(BaseModel):
    """Payload for updating an existing note."""

    title: Optional[str] = Field(None, max_length=500)
    content: Optional[str] = None
    category: Optional[str] = Field(None, max_length=100)
    is_pinned: Optional[bool] = None


class NoteResponse(BaseModel):
    """Serialized note response."""

    id: uuid.UUID
    title: Optional[str] = None
    content: Optional[str] = None
    category: Optional[str] = None
    is_pinned: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class NoteListResponse(BaseModel):
    """Paginated notes list response."""

    data: List[NoteResponse]
    meta: PaginationMeta
