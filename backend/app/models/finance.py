"""Finance models: FinanceItem and Subscription."""

import enum

from sqlalchemy import Boolean, Column, Date, Enum, ForeignKey, Numeric, String, Uuid

from app.models.base import BaseModel


class FinanceItemType(str, enum.Enum):
    INCOME = "income"
    EXPENSE = "expense"


class BillingCycle(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"


class FinanceItem(BaseModel):
    """Personal finance income or expense transaction."""

    __tablename__ = "finance_items"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    type = Column(
        Enum(FinanceItemType, name="finance_item_type", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    category = Column(String(100), nullable=True)
    date = Column(Date, nullable=False, index=True)
    description = Column(String(500), nullable=True)
    is_recurring = Column(Boolean, default=False, nullable=False)


class Subscription(BaseModel):
    """Recurring subscription expense."""

    __tablename__ = "subscriptions"

    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    currency = Column(String(3), default="INR", nullable=False)
    billing_cycle = Column(
        Enum(BillingCycle, name="billing_cycle", values_callable=lambda obj: [e.value for e in obj]),
        nullable=False,
    )
    next_payment = Column(Date, nullable=True)
    category = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
