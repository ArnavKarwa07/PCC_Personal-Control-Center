import React, { useState } from 'react';
import { Modal, Button, Input } from '../../components/ui';

interface CreateReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { week_start: string; week_end: string; status?: string }) => Promise<void>;
}

function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

export const CreateReviewModal: React.FC<CreateReviewModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const now = new Date();
  const currentMonday = getMonday(now);
  const currentSunday = new Date(currentMonday);
  currentSunday.setDate(currentMonday.getDate() + 6);

  const [weekStart, setWeekStart] = useState<string>(formatDate(currentMonday));
  const [weekEnd, setWeekEnd] = useState<string>(formatDate(currentSunday));
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSetThisWeek = () => {
    const mon = getMonday(new Date());
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    setWeekStart(formatDate(mon));
    setWeekEnd(formatDate(sun));
  };

  const handleSetLastWeek = () => {
    const mon = getMonday(new Date());
    mon.setDate(mon.getDate() - 7);
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    setWeekStart(formatDate(mon));
    setWeekEnd(formatDate(sun));
  };

  const handleSetThisMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setWeekStart(formatDate(firstDay));
    setWeekEnd(formatDate(lastDay));
  };

  const handleSetLastMonth = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth(), 0);
    setWeekStart(formatDate(firstDay));
    setWeekEnd(formatDate(lastDay));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weekStart || !weekEnd) return;

    setSubmitting(true);
    try {
      await onSubmit({
        week_start: weekStart,
        week_end: weekEnd,
        status: 'draft',
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start Review Session"
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={submitting}>
            Create Review Session
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="pcc-create-review-form">
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
          Select the timeframe for your retrospective reflection. Guided sections will be initialized automatically.
        </p>

        <div className="pcc-quick-select-dates">
          <button type="button" className="pcc-quick-date-btn" onClick={handleSetThisWeek}>
            📅 This Week
          </button>
          <button type="button" className="pcc-quick-date-btn" onClick={handleSetLastWeek}>
            ⏮️ Last Week
          </button>
          <button type="button" className="pcc-quick-date-btn" onClick={handleSetThisMonth}>
            🗓️ This Month
          </button>
          <button type="button" className="pcc-quick-date-btn" onClick={handleSetLastMonth}>
            ⏪ Last Month
          </button>
        </div>

        <div className="pcc-form-row">
          <Input
            id="review-start-date"
            label="Period Start Date"
            type="date"
            value={weekStart}
            onChange={(e) => setWeekStart(e.target.value)}
            required
          />
          <Input
            id="review-end-date"
            label="Period End Date"
            type="date"
            value={weekEnd}
            onChange={(e) => setWeekEnd(e.target.value)}
            required
          />
        </div>
      </form>
    </Modal>
  );
};
