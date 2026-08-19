"""Personal CRM & Contacts REST API endpoints."""

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


@router.get("", operation_id="listContacts", summary="List Contacts")
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
        db=db, user_id=current_user.id, search=search, overdue_only=overdue_only, page=page, per_page=per_page
    )
    return {
        "data": [ContactRead.model_validate(c).model_dump() for c in contacts],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("", operation_id="createContact", status_code=status.HTTP_201_CREATED, summary="Create Contact")
def create_contact(
    data: ContactCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new personal contact record."""
    contact = contact_service.create_contact(db=db, user_id=current_user.id, data=data)
    return {"data": ContactRead.model_validate(contact).model_dump()}


@router.put("/{contact_id}", operation_id="updateContactByIdPut", summary="Update Contact (PUT)")
@router.patch("/{contact_id}", operation_id="updateContactById", summary="Update Contact (PATCH)")
def update_contact(
    contact_id: uuid.UUID,
    data: ContactUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update contact details or record last interaction date."""
    contact = contact_service.update_contact(db=db, user_id=current_user.id, contact_id=contact_id, data=data)
    if not contact:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
    return {"data": ContactRead.model_validate(contact).model_dump()}


@router.delete("/{contact_id}", operation_id="deleteContactById", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Contact")
def delete_contact(
    contact_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a contact record."""
    success = contact_service.delete_contact(db=db, user_id=current_user.id, contact_id=contact_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact not found")
