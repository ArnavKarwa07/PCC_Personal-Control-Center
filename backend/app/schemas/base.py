"""Common Pydantic base schemas for standard API response envelopes and pagination."""

from typing import Any, Dict, Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

T = TypeVar("T")


class PaginationMeta(BaseModel):
    """Pagination metadata included in list responses."""

    total: int
    page: int
    per_page: int
    total_pages: int

    model_config = ConfigDict(from_attributes=True)


class SuccessResponse(BaseModel, Generic[T]):
    """Standard success response envelope matching TRD §14."""

    data: T
    meta: Optional[Dict[str, Any]] = None

    model_config = ConfigDict(from_attributes=True)


class ErrorDetail(BaseModel):
    """Detailed error object matching TRD §14."""

    code: str
    message: str


class ErrorResponse(BaseModel):
    """Standard error response envelope."""

    error: ErrorDetail
