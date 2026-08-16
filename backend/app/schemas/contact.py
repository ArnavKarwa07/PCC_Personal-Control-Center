"""Pydantic schemas for Personal CRM & Contacts."""

import uuid
from datetime import date
from typing import Optional

from pydantic import BaseModel, Field


class ContactBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    organization: Optional[str] = Field(default=None, max_length=255)
    role: Optional[str] = Field(default=None, max_length=255)
    email: Optional[str] = Field(default=None, max_length=255)
    phone: Optional[str] = Field(default=None, max_length=50)
    linkedin: Optional[str] = Field(default=None, max_length=500)
    notes: Optional[str] = None
    last_interaction: Optional[date] = None
    next_followup: Optional[date] = None


class ContactCreate(ContactBase):
    pass


class ContactUpdate(BaseModel):
    name: Optional[str] = None
    organization: Optional[str] = None
    role: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    notes: Optional[str] = None
    last_interaction: Optional[date] = None
    next_followup: Optional[date] = None


class ContactRead(ContactBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True
