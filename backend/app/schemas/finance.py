"""Pydantic schemas for Personal Finance management."""

import uuid
from datetime import date as PyDate
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, Field

from app.models.finance import BillingCycle, FinanceItemType


class FinanceItemBase(BaseModel):
    item_type: FinanceItemType = Field(..., alias="type", description="Income or Expense")
    amount: Decimal = Field(..., gt=0, description="Transaction amount")
    currency: str = Field(default="USD", max_length=3)
    category: Optional[str] = Field(default=None, max_length=100)
    transaction_date: PyDate = Field(..., alias="date", description="Transaction date")
    description: Optional[str] = Field(default=None, max_length=500)
    is_recurring: bool = Field(default=False)

    class Config:
        populate_by_name = True


class FinanceItemCreate(FinanceItemBase):
    pass


class FinanceItemUpdate(BaseModel):
    item_type: Optional[FinanceItemType] = Field(default=None, alias="type")
    amount: Optional[Decimal] = Field(default=None, gt=0)
    currency: Optional[str] = None
    category: Optional[str] = None
    transaction_date: Optional[PyDate] = Field(default=None, alias="date")
    description: Optional[str] = None
    is_recurring: Optional[bool] = None

    class Config:
        populate_by_name = True


class FinanceItemRead(FinanceItemBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True
        populate_by_name = True


class SubscriptionBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    billing_cycle: BillingCycle = Field(default=BillingCycle.MONTHLY)
    next_payment: Optional[PyDate] = None
    category: Optional[str] = Field(default=None, max_length=100)
    is_active: bool = Field(default=True)


class SubscriptionCreate(SubscriptionBase):
    pass


class SubscriptionUpdate(BaseModel):
    name: Optional[str] = None
    amount: Optional[Decimal] = Field(default=None, gt=0)
    currency: Optional[str] = None
    billing_cycle: Optional[BillingCycle] = None
    next_payment: Optional[PyDate] = None
    category: Optional[str] = None
    is_active: Optional[bool] = None


class SubscriptionRead(SubscriptionBase):
    id: uuid.UUID
    user_id: uuid.UUID

    class Config:
        from_attributes = True


class CategoryBreakdown(BaseModel):
    category: str
    total: float
    percentage: float


class FinanceSummaryRead(BaseModel):
    total_income: float
    total_expenses: float
    net_worth: float
    monthly_recurring_expenses: float
    category_breakdown: List[CategoryBreakdown]
    active_subscriptions_count: int
