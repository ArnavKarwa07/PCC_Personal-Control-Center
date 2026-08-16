"""Review and retrospective service layer."""

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy.orm import Session

from app.models.review import Review, ReviewEntry, ReviewSection, ReviewStatus
from app.schemas.review import ReviewCreate, ReviewUpdate


class ReviewService:
    """Service layer managing weekly/periodic retrospectives, guided reflections, and review telemetry."""

    DEFAULT_SECTIONS = [
        (ReviewSection.ACCOMPLISHMENTS, 0),
        (ReviewSection.OUTSTANDING, 1),
        (ReviewSection.REFLECTION, 2),
        (ReviewSection.NEXT_WEEK, 3),
    ]

    def list_reviews(
        self,
        db: Session,
        user_id: uuid.UUID,
        status: Optional[ReviewStatus] = None,
        page: int = 1,
        per_page: int = 20,
    ) -> Tuple[List[Review], int, int]:
        """List reviews for the user with optional status filter and pagination."""
        query = db.query(Review).filter(Review.user_id == user_id, Review.deleted_at.is_(None))
        if status:
            query = query.filter(Review.status == status)

        total = query.count()
        total_pages = (total + per_page - 1) // per_page if total > 0 else 1
        reviews = (
            query.order_by(Review.week_start.desc(), Review.created_at.desc())
            .offset((page - 1) * per_page)
            .limit(per_page)
            .all()
        )
        return reviews, total, total_pages

    def get_review(self, db: Session, user_id: uuid.UUID, review_id: uuid.UUID) -> Optional[Review]:
        """Retrieve a specific review session by ID."""
        return (
            db.query(Review)
            .filter(Review.id == review_id, Review.user_id == user_id, Review.deleted_at.is_(None))
            .first()
        )

    def get_current_week_review(self, db: Session, user_id: uuid.UUID) -> Optional[Review]:
        """Retrieve the review covering the current week, or latest active review."""
        today = date.today()
        # Calculate Monday (start of week) and Sunday (end of week)
        start_of_week = today - timedelta(days=today.weekday())
        end_of_week = start_of_week + timedelta(days=6)

        # First check if one exists for current week dates
        current = (
            db.query(Review)
            .filter(
                Review.user_id == user_id,
                Review.week_start <= today,
                Review.week_end >= today,
                Review.deleted_at.is_(None),
            )
            .order_by(Review.created_at.desc())
            .first()
        )
        if current:
            return current

        # Fallback to matching Monday to Sunday bounds
        return (
            db.query(Review)
            .filter(
                Review.user_id == user_id,
                Review.week_start == start_of_week,
                Review.week_end == end_of_week,
                Review.deleted_at.is_(None),
            )
            .first()
        )

    def create_review(self, db: Session, user_id: uuid.UUID, data: ReviewCreate) -> Review:
        """Create a new review session with guided reflection sections."""
        review = Review(
            user_id=user_id,
            week_start=data.week_start,
            week_end=data.week_end,
            status=data.status,
            completed_at=datetime.now(timezone.utc) if data.status == ReviewStatus.COMPLETED else None,
        )
        db.add(review)
        db.flush()

        if data.entries:
            for entry_data in data.entries:
                entry = ReviewEntry(
                    user_id=user_id,
                    review_id=review.id,
                    section=entry_data.section,
                    content=entry_data.content or "",
                    sort_order=entry_data.sort_order,
                )
                db.add(entry)
        else:
            # Seed default guided reflection sections
            for section, sort_order in self.DEFAULT_SECTIONS:
                entry = ReviewEntry(
                    user_id=user_id,
                    review_id=review.id,
                    section=section,
                    content="",
                    sort_order=sort_order,
                )
                db.add(entry)

        db.commit()
        db.refresh(review)
        return review

    def update_review(
        self,
        db: Session,
        user_id: uuid.UUID,
        review_id: uuid.UUID,
        data: ReviewUpdate,
    ) -> Optional[Review]:
        """Update an existing review session and optionally upsert its entries."""
        review = self.get_review(db=db, user_id=user_id, review_id=review_id)
        if not review:
            return None

        update_dict = data.model_dump(exclude_unset=True)

        if "week_start" in update_dict and update_dict["week_start"] is not None:
            review.week_start = update_dict["week_start"]
        if "week_end" in update_dict and update_dict["week_end"] is not None:
            review.week_end = update_dict["week_end"]
        if "status" in update_dict and update_dict["status"] is not None:
            review.status = update_dict["status"]
            if review.status == ReviewStatus.COMPLETED and not review.completed_at:
                review.completed_at = datetime.now(timezone.utc)
            elif review.status == ReviewStatus.DRAFT:
                review.completed_at = None

        if "completed_at" in update_dict:
            review.completed_at = update_dict["completed_at"]

        # If entries are specified, upsert them
        if data.entries is not None:
            for entry_data in data.entries:
                existing_entry = (
                    db.query(ReviewEntry)
                    .filter(
                        ReviewEntry.review_id == review.id,
                        ReviewEntry.section == entry_data.section,
                        ReviewEntry.deleted_at.is_(None),
                    )
                    .first()
                )
                if existing_entry:
                    existing_entry.content = entry_data.content
                    if entry_data.sort_order is not None:
                        existing_entry.sort_order = entry_data.sort_order
                else:
                    new_entry = ReviewEntry(
                        user_id=user_id,
                        review_id=review.id,
                        section=entry_data.section,
                        content=entry_data.content or "",
                        sort_order=entry_data.sort_order,
                    )
                    db.add(new_entry)

        db.commit()
        db.refresh(review)
        return review

    def complete_review(self, db: Session, user_id: uuid.UUID, review_id: uuid.UUID) -> Optional[Review]:
        """Mark a review as completed."""
        review = self.get_review(db=db, user_id=user_id, review_id=review_id)
        if not review:
            return None

        review.status = ReviewStatus.COMPLETED
        review.completed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(review)
        return review

    def upsert_entry(
        self,
        db: Session,
        user_id: uuid.UUID,
        review_id: uuid.UUID,
        section: ReviewSection,
        content: Optional[str],
        sort_order: Optional[int] = None,
    ) -> Optional[ReviewEntry]:
        """Upsert a single section entry within a review session."""
        review = self.get_review(db=db, user_id=user_id, review_id=review_id)
        if not review:
            return None

        entry = (
            db.query(ReviewEntry)
            .filter(
                ReviewEntry.review_id == review_id,
                ReviewEntry.section == section,
                ReviewEntry.deleted_at.is_(None),
            )
            .first()
        )

        if entry:
            entry.content = content or ""
            if sort_order is not None:
                entry.sort_order = sort_order
        else:
            default_sort = 0
            for sec, so in self.DEFAULT_SECTIONS:
                if sec == section:
                    default_sort = so
                    break

            entry = ReviewEntry(
                user_id=user_id,
                review_id=review_id,
                section=section,
                content=content or "",
                sort_order=sort_order if sort_order is not None else default_sort,
            )
            db.add(entry)

        db.commit()
        db.refresh(entry)
        return entry

    def delete_review(self, db: Session, user_id: uuid.UUID, review_id: uuid.UUID) -> bool:
        """Soft-delete or delete a review session."""
        review = self.get_review(db=db, user_id=user_id, review_id=review_id)
        if not review:
            return False

        db.delete(review)
        db.commit()
        return True

    def get_stats(self, db: Session, user_id: uuid.UUID) -> Dict[str, Any]:
        """Compute review stats, completion rate, and consecutive completion streaks."""
        reviews = (
            db.query(Review)
            .filter(Review.user_id == user_id, Review.deleted_at.is_(None))
            .order_by(Review.week_start.desc())
            .all()
        )

        total = len(reviews)
        completed = sum(1 for r in reviews if r.status == ReviewStatus.COMPLETED)
        drafts = total - completed
        completion_rate = round((completed / total) * 100, 1) if total > 0 else 0.0

        # Calculate streak of strictly consecutive weekly completed reviews (7 days apart)
        completed_reviews = [r for r in reviews if r.status == ReviewStatus.COMPLETED]
        streak = 0
        if completed_reviews:
            prev_date = None
            for r in completed_reviews:
                if prev_date is None:
                    streak += 1
                    prev_date = r.week_start
                else:
                    days_diff = (prev_date - r.week_start).days
                    if days_diff == 7:
                        streak += 1
                        prev_date = r.week_start
                    else:
                        break

        return {
            "total_reviews": total,
            "completed_reviews": completed,
            "draft_reviews": drafts,
            "completion_rate": completion_rate,
            "streak_weeks": streak,
        }


review_service = ReviewService()
