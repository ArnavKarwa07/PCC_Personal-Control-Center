"""Application exceptions and global error handling."""

from typing import Any, Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


class PCCException(Exception):
    """Base exception for all domain-specific errors in PCC."""

    def __init__(
        self,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        code: str = "BAD_REQUEST",
        message: str = "A business error occurred.",
        details: Optional[Any] = None,
    ):
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message
        self.details = details


class NotFoundException(PCCException):
    """Entity or resource not found."""

    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_404_NOT_FOUND, code=code, message=message, details=details)


class UnauthorizedException(PCCException):
    """Authentication failed or missing credentials."""

    def __init__(
        self, message: str = "Authentication required", code: str = "UNAUTHORIZED", details: Optional[Any] = None
    ):
        super().__init__(status_code=status.HTTP_401_UNAUTHORIZED, code=code, message=message, details=details)


class ForbiddenException(PCCException):
    """Action forbidden due to permissions or ownership check."""

    def __init__(
        self,
        message: str = "You do not have permission to access this resource",
        code: str = "FORBIDDEN",
        details: Optional[Any] = None,
    ):
        super().__init__(status_code=status.HTTP_403_FORBIDDEN, code=code, message=message, details=details)


class ConflictException(PCCException):
    """Conflict with existing state (e.g. duplicate email, unique constraint)."""

    def __init__(self, message: str = "Resource conflict", code: str = "CONFLICT", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_409_CONFLICT, code=code, message=message, details=details)


class BadRequestException(PCCException):
    """Invalid input or request parameters."""

    def __init__(self, message: str = "Invalid request", code: str = "BAD_REQUEST", details: Optional[Any] = None):
        super().__init__(status_code=status.HTTP_400_BAD_REQUEST, code=code, message=message, details=details)


class ValidationException(PCCException):
    """Validation failure on domain or business rules."""

    def __init__(
        self, message: str = "Validation failed", code: str = "VALIDATION_ERROR", details: Optional[Any] = None
    ):
        super().__init__(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, code=code, message=message, details=details)


def register_exception_handlers(app: FastAPI) -> None:
    """Register custom exception handlers to ensure TRD-compliant error JSON responses."""

    @app.exception_handler(PCCException)
    async def pcc_exception_handler(request: Request, exc: PCCException) -> JSONResponse:
        content = {
            "error": {
                "code": exc.code,
                "message": exc.message,
            }
        }
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
        first_error = exc.errors()[0] if exc.errors() else {"msg": "Validation failed", "loc": []}
        error_msg = f"{first_error.get('msg', 'Validation failed')} at {'.'.join(str(loc_item) for loc_item in first_error.get('loc', []))}"
        content = {
            "error": {
                "code": "VALIDATION_ERROR",
                "message": error_msg,
            }
        }
        return JSONResponse(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, content=content)

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
        code = "HTTP_ERROR"
        if exc.status_code == status.HTTP_401_UNAUTHORIZED:
            code = "UNAUTHORIZED"
        elif exc.status_code == status.HTTP_403_FORBIDDEN:
            code = "FORBIDDEN"
        elif exc.status_code == status.HTTP_404_NOT_FOUND:
            code = "NOT_FOUND"
        elif exc.status_code == status.HTTP_409_CONFLICT:
            code = "CONFLICT"

        content = {
            "error": {
                "code": code,
                "message": str(exc.detail),
            }
        }
        return JSONResponse(status_code=exc.status_code, content=content)

    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        content = {
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred.",
            }
        }
        return JSONResponse(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, content=content)
