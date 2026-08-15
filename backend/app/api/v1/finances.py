"""Personal Finance REST API endpoints."""

import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.finance import FinanceItemType
from app.models.user import User
from app.schemas.finance import (
    FinanceItemCreate,
    FinanceItemRead,
    FinanceSummaryRead,
    SubscriptionCreate,
    SubscriptionRead,
)
from app.services.finance_service import finance_service

router = APIRouter(prefix="/finances", tags=["Finances"])


@router.get("/summary", response_model=FinanceSummaryRead, summary="Get Financial Summary")
def get_finance_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Retrieve net worth, total income, total expenses, and budget breakdowns."""
    return finance_service.get_summary(db=db, user_id=current_user.id)


@router.get("/items", summary="List Finance Items")
def list_finance_items(
    type: Optional[FinanceItemType] = None,
    category: Optional[str] = None,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List financial income and expense transactions."""
    items, total, total_pages = finance_service.list_items(
        db=db, user_id=current_user.id, item_type=type, category=category, page=page, per_page=per_page
    )
    return {
        "data": [FinanceItemRead.model_validate(i).model_dump() for i in items],
        "meta": {"total": total, "page": page, "per_page": per_page, "total_pages": total_pages},
    }


@router.post("/items", status_code=status.HTTP_201_CREATED, summary="Create Finance Item")
def create_finance_item(
    data: FinanceItemCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Record a new income or expense transaction."""
    item = finance_service.create_item(db=db, user_id=current_user.id, data=data)
    return {"data": FinanceItemRead.model_validate(item).model_dump()}


@router.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Finance Item")
def delete_finance_item(
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a finance item."""
    success = finance_service.delete_item(db=db, user_id=current_user.id, item_id=item_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Finance item not found")


@router.get("/subscriptions", summary="List Subscriptions")
def list_subscriptions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List all recurring subscriptions."""
    subs = finance_service.list_subscriptions(db=db, user_id=current_user.id)
    return {"data": [SubscriptionRead.model_validate(s).model_dump() for s in subs]}


@router.post("/subscriptions", status_code=status.HTTP_201_CREATED, summary="Create Subscription")
def create_subscription(
    data: SubscriptionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Register a new recurring subscription."""
    sub = finance_service.create_subscription(db=db, user_id=current_user.id, data=data)
    return {"data": SubscriptionRead.model_validate(sub).model_dump()}
