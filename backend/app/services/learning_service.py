"""Learning service layer managing courses, books, reading lists, and progress tracking."""

import uuid
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.learning import LearningItem, LearningResourceType, LearningStatus
from app.schemas.learning import LearningItemCreate, LearningItemUpdate


class LearningService:
    """Service layer managing learning materials, reading lists, and curriculum."""

    def list_items(
        self,
        db: Session,
        user_id: uuid.UUID,
        resource_type: Optional[LearningResourceType] = None,
        status: Optional[LearningStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[LearningItem], int, int]:
        """List learning items with optional filtering, search, and pagination."""
        query = db.query(LearningItem).filter(LearningItem.user_id == user_id)

        if resource_type:
            query = query.filter(LearningItem.resource_type == resource_type)
        if status:
            query = query.filter(LearningItem.status == status)
        if search:
            query = query.filter(
                (LearningItem.title.ilike(f"%{search}%"))
                | (LearningItem.notes.ilike(f"%{search}%"))
                | (LearningItem.url.ilike(f"%{search}%"))
            )

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        items = (
            query.order_by(LearningItem.updated_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return items, total, total_pages

    def get_item(self, db: Session, user_id: uuid.UUID, item_id: uuid.UUID) -> Optional[LearningItem]:
        """Get a single learning item by ID."""
        return db.query(LearningItem).filter(LearningItem.id == item_id, LearningItem.user_id == user_id).first()

    def create_item(self, db: Session, user_id: uuid.UUID, data: LearningItemCreate) -> LearningItem:
        """Create a new learning item."""
        item = LearningItem(user_id=user_id, **data.model_dump())
        # Auto-update status if progress is 100%
        if item.progress >= 100.0 and item.status != LearningStatus.COMPLETED:
            item.status = LearningStatus.COMPLETED
        db.add(item)
        db.commit()
        db.refresh(item)
        return item

    def update_item(
        self, db: Session, user_id: uuid.UUID, item_id: uuid.UUID, data: LearningItemUpdate
    ) -> Optional[LearningItem]:
        """Update an existing learning item."""
        item = self.get_item(db, user_id, item_id)
        if not item:
            return None

        update_dict = data.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            setattr(item, key, val)

        # Auto-complete if progress reached 100%
        if "progress" in update_dict and item.progress >= 100.0 and "status" not in update_dict:
            item.status = LearningStatus.COMPLETED

        db.commit()
        db.refresh(item)
        return item

    def delete_item(self, db: Session, user_id: uuid.UUID, item_id: uuid.UUID) -> bool:
        """Delete a learning item."""
        item = self.get_item(db, user_id, item_id)
        if not item:
            return False
        db.delete(item)
        db.commit()
        return True

    def get_stats(self, db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """Calculate statistics for user learning items."""
        items = db.query(LearningItem).filter(LearningItem.user_id == user_id).all()
        total = len(items)
        if total == 0:
            return {
                "total": 0,
                "completed": 0,
                "in_progress": 0,
                "saved": 0,
                "planned": 0,
                "practicing": 0,
                "by_type": {},
                "average_progress": 0.0,
            }

        completed = sum(1 for i in items if i.status == LearningStatus.COMPLETED)
        in_progress = sum(1 for i in items if i.status == LearningStatus.LEARNING)
        saved = sum(1 for i in items if i.status == LearningStatus.SAVED)
        planned = sum(1 for i in items if i.status == LearningStatus.PLANNED)
        practicing = sum(1 for i in items if i.status == LearningStatus.PRACTICING)
        avg_progress = round(sum(i.progress for i in items) / total, 1)

        by_type: Dict[str, int] = {}
        for i in items:
            t = i.resource_type.value if hasattr(i.resource_type, "value") else str(i.resource_type)
            by_type[t] = by_type.get(t, 0) + 1

        return {
            "total": total,
            "completed": completed,
            "in_progress": in_progress,
            "saved": saved,
            "planned": planned,
            "practicing": practicing,
            "by_type": by_type,
            "average_progress": avg_progress,
        }


learning_service = LearningService()
