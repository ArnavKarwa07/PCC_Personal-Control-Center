import React from 'react';
import { Badge, Button } from '../../components/ui';
import type { Review } from '../../types';

interface ReviewCardProps {
  review: Review;
  isActive: boolean;
  onSelect: (review: Review) => void;
  onDelete: (id: string) => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isActive,
  onSelect,
  onDelete,
}) => {
  const accomplishmentsEntry = review.entries?.find((e) => e.section === 'accomplishments')?.content;
  const filledEntriesCount =
    review.entries?.filter((e) => e.content && e.content.trim().length > 0).length ?? 0;
  const totalEntriesCount = review.entries?.length || 4;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the review for ${review.week_start}?`)) {
      onDelete(review.id);
    }
  };

  return (
    <div
      className={`pcc-review-item-card ${isActive ? 'pcc-review-item-card--active' : ''}`}
      onClick={() => onSelect(review)}
    >
      <div className="pcc-review-item-card__header">
        <span className="pcc-review-item-card__date-range">
          🗓️ {review.week_start}
        </span>
        <Badge
          variant={review.status === 'completed' ? 'success' : 'warning'}
          size="sm"
        >
          {review.status === 'completed' ? 'Completed' : 'Draft'}
        </Badge>
      </div>

      <div className="pcc-review-item-card__preview">
        {accomplishmentsEntry && accomplishmentsEntry.trim().length > 0
          ? accomplishmentsEntry
          : 'No accomplishments recorded yet. Click to begin reflection.'}
      </div>

      <div className="pcc-review-item-card__footer">
        <span className="pcc-review-item-card__entries-count">
          📝 {filledEntriesCount}/{totalEntriesCount} filled
        </span>

        <Button
          size="sm"
          variant="ghost"
          onClick={handleDelete}
          style={{ padding: '2px 6px', fontSize: '11px', color: 'var(--color-error)' }}
          title="Delete Review"
        >
          🗑️
        </Button>
      </div>
    </div>
  );
};
