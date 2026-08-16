import React from 'react';
import { Card, Badge } from '../../components/ui';
import type { ReviewStats } from '../../types';

interface ReviewStatsRibbonProps {
  stats: ReviewStats | null;
  loading?: boolean;
}

export const ReviewStatsRibbon: React.FC<ReviewStatsRibbonProps> = ({ stats, loading }) => {
  const total = stats?.total_reviews ?? 0;
  const completed = stats?.completed_reviews ?? 0;
  const drafts = stats?.draft_reviews ?? 0;
  const rate = stats?.completion_rate ?? 0;
  const streak = stats?.streak_weeks ?? 0;

  return (
    <div className="pcc-reviews-stats-grid">
      <Card glass padding="md" className="pcc-review-stat-card">
        <div className="pcc-review-stat-card__top">
          <span className="pcc-review-stat-card__label">Review Streak</span>
          <span className="pcc-review-stat-card__icon">🔥</span>
        </div>
        <div className="pcc-review-stat-card__value">
          {loading ? '...' : `${streak} ${streak === 1 ? 'Week' : 'Weeks'}`}
        </div>
        <div className="pcc-review-stat-card__meta">
          <Badge variant={streak > 0 ? 'success' : 'default'} size="sm">
            {streak > 0 ? 'Active Momentum' : 'Start streak'}
          </Badge>
          <span>consecutive</span>
        </div>
      </Card>

      <Card glass padding="md" className="pcc-review-stat-card">
        <div className="pcc-review-stat-card__top">
          <span className="pcc-review-stat-card__label">Completion Rate</span>
          <span className="pcc-review-stat-card__icon">🎯</span>
        </div>
        <div className="pcc-review-stat-card__value">
          {loading ? '...' : `${rate}%`}
        </div>
        <div className="pcc-stat-progress-bar">
          <div className="pcc-stat-progress-bar__fill" style={{ width: `${rate}%` }} />
        </div>
      </Card>

      <Card glass padding="md" className="pcc-review-stat-card">
        <div className="pcc-review-stat-card__top">
          <span className="pcc-review-stat-card__label">Completed Sessions</span>
          <span className="pcc-review-stat-card__icon">✅</span>
        </div>
        <div className="pcc-review-stat-card__value">
          {loading ? '...' : completed}
        </div>
        <div className="pcc-review-stat-card__meta">
          <span>of {total} total recorded</span>
        </div>
      </Card>

      <Card glass padding="md" className="pcc-review-stat-card">
        <div className="pcc-review-stat-card__top">
          <span className="pcc-review-stat-card__label">Active Drafts</span>
          <span className="pcc-review-stat-card__icon">📝</span>
        </div>
        <div className="pcc-review-stat-card__value">
          {loading ? '...' : drafts}
        </div>
        <div className="pcc-review-stat-card__meta">
          <Badge variant={drafts > 0 ? 'warning' : 'primary'} size="sm">
            {drafts > 0 ? 'In Progress' : 'All Clear'}
          </Badge>
          <span>pending reflection</span>
        </div>
      </Card>
    </div>
  );
};
