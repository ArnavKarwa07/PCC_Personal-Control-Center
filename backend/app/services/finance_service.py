"""Personal Finance service logic."""

import uuid
from typing import List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.finance import BillingCycle, FinanceItem, FinanceItemType, Subscription
from app.schemas.finance import (
    CategoryBreakdown,
    FinanceItemCreate,
    FinanceSummaryRead,
    SubscriptionCreate,
)


class FinanceService:
    """Service layer managing user income, expenses, subscriptions, and financial metrics."""

    def list_items(
        self,
        db: Session,
        user_id: uuid.UUID,
        item_type: Optional[FinanceItemType] = None,
        category: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[FinanceItem], int, int]:
        query = db.query(FinanceItem).filter(FinanceItem.user_id == user_id)
        if item_type:
            query = query.filter(FinanceItem.type == item_type)
        if category:
            query = query.filter(FinanceItem.category.ilike(f"%{category}%"))

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        items = query.order_by(FinanceItem.date.desc()).offset((page - 1) * per_page).limit(per_page).all()
        return items, total, total_pages

    def create_item(self, db: Session, user_id: uuid.UUID, data: FinanceItemCreate) -> FinanceItem:
        item = FinanceItem(user_id=user_id, **data.model_dump(by_alias=True))
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def delete_item(self, db: Session, user_id: uuid.UUID, item_id: uuid.UUID) -> bool:
        item = db.query(FinanceItem).filter(FinanceItem.id == item_id, FinanceItem.user_id == user_id).first()
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    def list_subscriptions(self, db: Session, user_id: uuid.UUID) -> List[Subscription]:
        return db.query(Subscription).filter(Subscription.user_id == user_id).order_by(Subscription.name.asc()).all()

    def create_subscription(self, db: Session, user_id: uuid.UUID, data: SubscriptionCreate) -> Subscription:
        sub = Subscription(user_id=user_id, **data.model_dump())
        db.add(sub)
        db.commit()
        db.refresh(sub)
        return sub

    def get_summary(self, db: Session, user_id: uuid.UUID) -> FinanceSummaryRead:
        items = db.query(FinanceItem).filter(FinanceItem.user_id == user_id).all()
        subs = db.query(Subscription).filter(Subscription.user_id == user_id, Subscription.is_active.is_(True)).all()

        total_income = sum(float(i.amount) for i in items if i.type == FinanceItemType.INCOME)
        total_expenses = sum(float(i.amount) for i in items if i.type == FinanceItemType.EXPENSE)
        net_worth = total_income - total_expenses

        monthly_recurring = 0.0
        for s in subs:
            amt = float(s.amount)
            if s.billing_cycle == BillingCycle.YEARLY:
                monthly_recurring += amt / 12.0
            else:
                monthly_recurring += amt

        # Category breakdown for expenses
        expense_by_cat = {}
        for i in items:
            if i.type == FinanceItemType.EXPENSE:
                cat = i.category or "Uncategorized"
                expense_by_cat[cat] = expense_by_cat.get(cat, 0.0) + float(i.amount)

        breakdown = []
        if total_expenses > 0:
            for cat, amt in expense_by_cat.items():
                breakdown.append(
                    CategoryBreakdown(
                        category=cat,
                        total=round(amt, 2),
                        percentage=round((amt / total_expenses) * 100.0, 1),
                    )
                )

        return FinanceSummaryRead(
            total_income=round(total_income, 2),
            total_expenses=round(total_expenses, 2),
            net_worth=round(net_worth, 2),
            monthly_recurring_expenses=round(monthly_recurring, 2),
            category_breakdown=breakdown,
            active_subscriptions_count=len(subs),
        )


finance_service = FinanceService()
