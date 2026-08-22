"""Personal CRM & Contacts REST API endpoints."""

from app.core.config import settings
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.schemas.contact import ContactCreate, ContactRead, ContactUpdate
from app.services.contact_service import contact_service

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("/list_contacts", operation_id="list_contacts", summary="List Contacts")
def list_contacts(
    search: Optional[str] = None,
    overdue_only: bool = False,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve contacts directory with search and catch-up follow-up filtering."""
    contacts, total, total_pages = contact_service.list_contacts(
        db=db, user_id=settings.DEFAULT_OWNER_ID, search=search, overdue_only=overdue_only, page=page, per_page=per_page
    )
    return {
        "data": [ContactRead.model_validate(c).model_dump() for c in contacts],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/create_contact", operation_id="create_contact", status_code=status.HTTP_201_CREATED, summary="Create Contact")
def create_contact(
    data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new personal contact record."""
    contact = contact_service.create_contact(db=db, user_id=settings.DEFAULT_OWNER_ID, data=data)
    return {"data": ContactRead.model_validate(contact).model_dump()}


@router.get("/get_contact_by_id/{contact_id}", operation_id="get_contact_by_id", summary="Get Contact By Id")
def get_contact_by_id(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve single contact by ID."""
    contact = contact_service.get_contact(db=db, user_id=settings.DEFAULT_OWNER_ID, contact_id=contact_id)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return {"data": ContactRead.model_validate(contact).model_dump()}


@router.patch("/update_contact_by_id/{contact_id}", operation_id="update_contact_by_id", summary="Update Contact By Id")
def update_contact(
    contact_id: uuid.UUID,
    data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update contact details or record last interaction date."""
    contact = contact_service.update_contact(db=db, user_id=settings.DEFAULT_OWNER_ID, contact_id=contact_id, data=data)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return {"data": ContactRead.model_validate(contact).model_dump()}


@router.delete("/delete_contact_by_id/{contact_id}", operation_id="delete_contact_by_id", summary="Delete Contact By Id")
def delete_contact(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a contact record."""
    success = contact_service.delete_contact(db=db, user_id=settings.DEFAULT_OWNER_ID, contact_id=contact_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
