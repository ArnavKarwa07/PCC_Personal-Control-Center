"""Global Search schemas for cross-entity search results and aggregations."""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field


class SearchResultItem(BaseModel):
    """Unified search result item across all supported entity types."""

    id: str = Field(..., description="Entity unique ID")
    entity_type: str = Field(
        ...,
        description="Entity category: task, project, note, idea, calendar_event, contact, goal, finance, reminder",
    )
    title: str = Field(..., description="Primary title or display name")
    snippet: Optional[str] = Field(None, description="Contextual snippet highlighting matching terms")
    relevance: float = Field(..., ge=0.0, le=1.0, description="Match relevance score between 0 and 1")
    url: str = Field(..., description="Frontend navigation route")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Entity specific metadata chips/attributes")
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class SearchMeta(BaseModel):
    """Metadata detailing search execution counts and filtering."""

    query: str
    total: int
    types_searched: List[str]
    counts_by_type: Dict[str, int]
    limit: int
    offset: int


class SearchResponse(BaseModel):
    """Top-level search API response structure."""

    data: List[SearchResultItem]
    meta: SearchMeta
