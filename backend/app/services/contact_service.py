"""Personal CRM & Contacts service layer."""

import uuid
from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.contact import Contact
from app.schemas.contact import ContactCreate, ContactUpdate


class ContactService:
    """Service layer managing personal contacts and catch-up reminders."""

    def list_contacts(
        self,
        db: Session,
        user_id: uuid.UUID,
        search: Optional[str] = None,
        overdue_only: bool = False,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Contact], int, int]:
        query = db.query(Contact).filter(Contact.user_id == user_id)
        if search:
            query = query.filter(
                (Contact.name.ilike(f"%{search}%"))
                | (Contact.organization.ilike(f"%{search}%"))
                | (Contact.role.ilike(f"%{search}%"))
            )
        if overdue_only:
            query = query.filter(Contact.next_followup <= date.today())

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        contacts = query.order_by(Contact.name.asc()).offset((page - 1) * per_page).limit(per_page).all()
        return contacts, total, total_pages

    def create_contact(self, db: Session, user_id: uuid.UUID, data: ContactCreate) -> Contact:
        contact = Contact(user_id=user_id, **data.model_dump())
        db.add(contact)
        db.commit()
        db.refresh(contact)
        return contact

    def update_contact(self, db: Session, user_id: uuid.UUID, contact_id: uuid.UUID, data: ContactUpdate) -> Optional[Contact]:
        contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == user_id).first()
        if not contact:
            return None
        for key, val in data.model_dump(exclude_unset=True).items():
            setattr(contact, key, val)
        db.commit()
        db.refresh(contact)
        return contact

    def delete_contact(self, db: Session, user_id: uuid.UUID, contact_id: uuid.UUID) -> bool:
        contact = db.query(Contact).filter(Contact.id == contact_id, Contact.user_id == user_id).first()
        if not contact:
            return False
        db.delete(contact)
        db.commit()
        return True


contact_service = ContactService()
