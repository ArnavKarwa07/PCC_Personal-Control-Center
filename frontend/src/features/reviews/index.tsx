import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { reviewApi } from '../../services/api';
import type { Review, ReviewSection, ReviewStats } from '../../types';
import { CreateReviewModal } from './CreateReviewModal';
import { GuidedReflectionEditor } from './GuidedReflectionEditor';
import { ReviewCard } from './ReviewCard';
import { ReviewStatsRibbon } from './ReviewStatsRibbon';
import './ReviewsPage.css';

export const ReviewsPage: React.FC = () => {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [activeReview, setActiveReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const fetchReviewsAndStats = useCallback(async () => {
    try {
      setLoading(true);
      const [reviewsRes, statsRes] = await Promise.all([
        reviewApi.getAll(filterStatus),
        reviewApi.getStats(),
      ]);

      const fetchedReviews = reviewsRes.data;
      setReviews(fetchedReviews);
      setStats(statsRes.data);

      if (fetchedReviews.length > 0) {
        setActiveReview((prev) => {
          if (prev) {
            const found = fetchedReviews.find((r: Review) => r.id === prev.id);
            if (found) return found;
          }
          return fetchedReviews[0];
        });
      } else {
        setActiveReview(null);
      }
    } catch (err) {
      toast.error('Failed to load reviews data');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, toast]);

  useEffect(() => {
    fetchReviewsAndStats();
  }, [fetchReviewsAndStats]);

  const handleCreateReview = async (data: { week_start: string; week_end: string; status?: string }) => {
    try {
      const res = await reviewApi.create(data);
      toast.success('New weekly review session started!');
      await fetchReviewsAndStats();
      setActiveReview(res.data);
    } catch (err) {
      toast.error('Failed to create review session');
    }
  };

  const handleSaveEntry = async (section: ReviewSection, content: string) => {
    if (!activeReview) return;
    try {
      await reviewApi.upsertEntry(activeReview.id, section, content);
      toast.success('Section saved');

      const detailRes = await reviewApi.getById(activeReview.id);
      setActiveReview(detailRes.data);
      setReviews((prev) =>
        prev.map((r) => (r.id === activeReview.id ? detailRes.data : r))
      );
    } catch (err) {
      toast.error('Failed to save reflection section');
    }
  };

  const handleCompleteReview = async () => {
    if (!activeReview) return;
    try {
      const res = await reviewApi.complete(activeReview.id);
      toast.success('Review marked as completed! Great job! 🎉');
      setActiveReview(res.data);
      await fetchReviewsAndStats();
    } catch (err) {
      toast.error('Failed to complete review');
    }
  };

  const handleReopenReview = async () => {
    if (!activeReview) return;
    try {
      const res = await reviewApi.update(activeReview.id, { status: 'draft' });
      toast.info('Review reopened as draft');
      setActiveReview(res.data);
      await fetchReviewsAndStats();
    } catch (err) {
      toast.error('Failed to reopen review');
    }
  };

  const handleDeleteReview = async (id: string) => {
    try {
      await reviewApi.delete(id);
      toast.info('Review session deleted');
      if (activeReview?.id === id) {
        setActiveReview(null);
      }
      await fetchReviewsAndStats();
    } catch (err) {
      toast.error('Failed to delete review');
    }
  };

  return (
    <div className="pcc-reviews-container">
      {/* Header */}
      <div className="pcc-reviews-header">
        <div>
          <h1 className="pcc-reviews-header__title">Weekly & Monthly Reviews</h1>
          <p className="pcc-reviews-header__subtitle">
            Structured retrospectives to align actions, celebrate wins, and continuous growth.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          ✨ Start New Review
        </Button>
      </div>

      {/* Stats telemetry */}
      {stats && <ReviewStatsRibbon stats={stats} />}

      {/* Main split view */}
      <div className="pcc-reviews-layout">
        {/* Sidebar session list */}
        <div className="pcc-reviews-sidebar">
          <div className="pcc-reviews-sidebar__header">
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 600 }}>Sessions</h3>
            <div className="pcc-reviews-filter-pills">
              {(['all', 'draft', 'completed'] as const).map((status) => (
                <button
                  key={status}
                  className={`pcc-reviews-filter-pill ${filterStatus === status ? 'pcc-reviews-filter-pill--active' : ''}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="pcc-reviews-sidebar__list">
            {loading ? (
              <div className="pcc-reviews-empty-state">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="pcc-reviews-empty-state">
                <p>No reviews found.</p>
                <Button size="sm" variant="secondary" onClick={() => setIsModalOpen(true)}>
                  Create First Review
                </Button>
              </div>
            ) : (
              reviews.map((rev) => (
                <ReviewCard
                  key={rev.id}
                  review={rev}
                  isActive={activeReview?.id === rev.id}
                  onSelect={setActiveReview}
                  onDelete={handleDeleteReview}
                />
              ))
            )}
          </div>
        </div>

        {/* Main reflection area */}
        <div className="pcc-reviews-main">
          {activeReview ? (
            <GuidedReflectionEditor
              review={activeReview}
              onSaveEntry={handleSaveEntry}
              onComplete={handleCompleteReview}
              onReopen={handleReopenReview}
            />
          ) : (
            <div className="pcc-reviews-editor-empty">
              <div className="pcc-reviews-editor-empty__icon">📝</div>
              <h3>No Review Selected</h3>
              <p>Select a retrospective session from the sidebar or launch a new weekly review.</p>
              <Button variant="primary" onClick={() => setIsModalOpen(true)}>
                Start New Review Session
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      <CreateReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateReview}
      />
    </div>
  );
};

export default ReviewsPage;
