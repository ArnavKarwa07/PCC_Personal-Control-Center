import React, { useState } from 'react';
import { useReminderStore, ReminderFilterStatus } from '../../stores/reminderStore';
import { useToast } from '../../hooks/useToast';
import { Button, Input, Badge, EmptyState, Dropdown } from '../../components/ui';
import { AddReminderModal } from './AddReminderModal';
import { cn } from '../../utils';
import type { Reminder, ReminderPriority } from '../../types';
import './Reminders.css';

export const RemindersPage: React.FC = () => {
  const {
    reminders,
    filterStatus,
    filterCategory,
    searchQuery,
    setFilterStatus,
    setFilterCategory,
    setSearchQuery,
    toggleComplete,
    snoozeReminder,
    deleteReminder,
  } = useReminderStore();

  const { toast } = useToast();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const todayStr = '2026-08-15';

  // Stats
  const totalActive = reminders.filter((r) => !r.completed).length;
  const dueToday = reminders.filter((r) => !r.completed && r.dueDate === todayStr).length;
  const snoozedCount = reminders.filter(
    (r) => !r.completed && r.snoozedUntil && new Date(r.snoozedUntil) > new Date()
  ).length;
  const completedCount = reminders.filter((r) => r.completed).length;

  // Filter categories
  const categories = ['all', ...Array.from(new Set(reminders.map((r) => r.category || 'General')))];

  // Filtered list
  const filteredReminders = reminders.filter((r) => {
    // Status
    if (filterStatus === 'today') {
      if (r.completed || r.dueDate !== todayStr) return false;
    } else if (filterStatus === 'upcoming') {
      if (r.completed || r.dueDate <= todayStr) return false;
    } else if (filterStatus === 'snoozed') {
      if (r.completed || !r.snoozedUntil || new Date(r.snoozedUntil) <= new Date()) return false;
    } else if (filterStatus === 'completed') {
      if (!r.completed) return false;
    }

    // Category
    if (filterCategory !== 'all' && (r.category || 'General') !== filterCategory) {
      return false;
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = r.title.toLowerCase().includes(q);
      const matchNotes = r.notes?.toLowerCase().includes(q);
      const matchTag = r.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchNotes || matchTag;
    }

    return true;
  });

  const getPriorityVariant = (priority: ReminderPriority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'accent';
      case 'low':
      default:
        return 'default';
    }
  };

  const getSnoozeDropdownItems = (reminderId: string) => [
    {
      id: 'snooze-10m',
      label: 'Snooze for 10 minutes',
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      onClick: () => {
        snoozeReminder(reminderId, 10);
        toast.info('Snoozed for 10 minutes');
      },
    },
    {
      id: 'snooze-1h',
      label: 'Snooze for 1 hour',
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M5 22h14" />
          <path d="M5 2h14" />
          <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
          <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
        </svg>
      ),
      onClick: () => {
        snoozeReminder(reminderId, 60);
        toast.info('Snoozed for 1 hour');
      },
    },
    {
      id: 'snooze-tomorrow',
      label: 'Snooze until tomorrow morning (09:00)',
      icon: (
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="M4.93 4.93l1.41 1.41" />
          <path d="M17.66 17.66l1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="M6.34 17.66l-1.41 1.41" />
          <path d="M19.07 4.93l-1.41 1.41" />
        </svg>
      ),
      onClick: () => {
        snoozeReminder(reminderId, 14 * 60);
        toast.info('Snoozed until tomorrow');
      },
    },
  ];

  return (
    <div className="pcc-reminders-page">
      {/* Header */}
      <header className="pcc-reminders-header">
        <div className="pcc-reminders-header__titles">
          <h1>Reminders & Scheduled Nudges</h1>
        </div>

        <div className="pcc-reminders-header__actions">
          <Button
            id="btn-add-reminder"
            variant="primary"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Reminder
          </Button>
        </div>
      </header>

      {/* Summary Stats Grid */}
      <div className="pcc-reminders-stats">
        <div className="pcc-reminders-stat-card">
          <div className="pcc-reminders-stat-card__icon pcc-reminders-stat-card__icon--primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
          </div>
          <div className="pcc-reminders-stat-card__content">
            <span className="pcc-reminders-stat-card__value">{totalActive}</span>
            <span className="pcc-reminders-stat-card__label">Active Reminders</span>
          </div>
        </div>

        <div className="pcc-reminders-stat-card">
          <div className="pcc-reminders-stat-card__icon pcc-reminders-stat-card__icon--warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="pcc-reminders-stat-card__content">
            <span className="pcc-reminders-stat-card__value">{dueToday}</span>
            <span className="pcc-reminders-stat-card__label">Due Today</span>
          </div>
        </div>

        <div className="pcc-reminders-stat-card">
          <div className="pcc-reminders-stat-card__icon pcc-reminders-stat-card__icon--info">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </div>
          <div className="pcc-reminders-stat-card__content">
            <span className="pcc-reminders-stat-card__value">{snoozedCount}</span>
            <span className="pcc-reminders-stat-card__label">Currently Snoozed</span>
          </div>
        </div>

        <div className="pcc-reminders-stat-card">
          <div className="pcc-reminders-stat-card__icon pcc-reminders-stat-card__icon--success">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="pcc-reminders-stat-card__content">
            <span className="pcc-reminders-stat-card__value">{completedCount}</span>
            <span className="pcc-reminders-stat-card__label">Completed</span>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="pcc-reminders-controls">
        <div className="pcc-reminders-controls__filters">
          {(
            [
              { id: 'all', label: 'All Statuses' },
              { id: 'today', label: 'Due Today' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'snoozed', label: 'Snoozed' },
              { id: 'completed', label: 'Completed' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              className={cn(
                'pcc-reminders-filter-pill',
                filterStatus === item.id && 'pcc-reminders-filter-pill--active'
              )}
              onClick={() => setFilterStatus(item.id as ReminderFilterStatus)}
            >
              {item.label}
            </button>
          ))}

          {categories.length > 1 && (
            <select
              id="reminders-category-filter"
              className="pcc-reminders-filter-pill"
              style={{ outline: 'none' }}
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  Category: {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="pcc-reminders-controls__search">
          <Input
            id="reminders-search"
            placeholder="Search reminders..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Reminders List */}
      <div className="pcc-reminders-list">
        {filteredReminders.length === 0 ? (
          <EmptyState
            title="No reminders match your filter"
            description="Create a new reminder to schedule time-based or recurring alerts."
            actionLabel="Create Reminder"
            onAction={() => setIsAddModalOpen(true)}
          />
        ) : (
          filteredReminders.map((reminder: Reminder) => {
            const isSnoozed =
              !reminder.completed &&
              reminder.snoozedUntil &&
              new Date(reminder.snoozedUntil) > new Date();
            const isOverdue =
              !reminder.completed &&
              (reminder.dueDate < todayStr ||
                (reminder.dueDate === todayStr && reminder.dueTime < '12:00'));

            return (
              <div
                key={reminder.id}
                id={`reminder-${reminder.id}`}
                className={cn(
                  'pcc-reminder-card',
                  reminder.completed && 'pcc-reminder-card--completed',
                  isSnoozed && 'pcc-reminder-card--snoozed',
                  reminder.priority === 'urgent' && 'pcc-reminder-card--urgent'
                )}
              >
                <div className="pcc-reminder-card__left">
                  {/* Checkbox button */}
                  <button
                    type="button"
                    className={cn(
                      'pcc-reminder-checkbox',
                      reminder.completed && 'pcc-reminder-checkbox--checked'
                    )}
                    onClick={() => toggleComplete(reminder.id)}
                    aria-label={reminder.completed ? 'Mark uncompleted' : 'Mark completed'}
                  >
                    {reminder.completed && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>

                  <div className="pcc-reminder-card__info">
                    <span className="pcc-reminder-card__title">{reminder.title}</span>

                    {reminder.notes && (
                      <p className="pcc-reminder-card__notes">{reminder.notes}</p>
                    )}

                    <div className="pcc-reminder-card__meta">
                      <span
                        className={cn(
                          'pcc-reminder-card__time',
                          isOverdue && 'pcc-reminder-card__time--overdue'
                        )}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <polyline points="12 6 12 12 16 14" />
                        </svg>
                        {reminder.dueDate === todayStr
                          ? `Today at ${reminder.dueTime}`
                          : `${reminder.dueDate} at ${reminder.dueTime}`}
                      </span>

                      {reminder.recurrence !== 'none' && (
                        <span className="pcc-reminder-card__recurrence-badge">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="17 1 21 5 17 9" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                          {reminder.recurrence}
                        </span>
                      )}

                      {reminder.category && (
                        <Badge variant="default" size="sm">
                          {reminder.category}
                        </Badge>
                      )}

                      <Badge variant={getPriorityVariant(reminder.priority)} size="sm">
                        {reminder.priority}
                      </Badge>

                      {isSnoozed && (
                        <Badge variant="warning" size="sm">
                          Snoozed
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pcc-reminder-card__right">
                  {!reminder.completed && (
                    <Dropdown
                      trigger={
                        <button type="button" className="pcc-reminder-snooze-btn">
                          <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="13" r="8" />
                            <polyline points="12 9 12 13 15 13" />
                          </svg>
                          <span>Snooze</span>
                        </button>
                      }
                      items={getSnoozeDropdownItems(reminder.id)}
                      align="right"
                    />
                  )}

                  <button
                    type="button"
                    className="pcc-reminder-action-btn pcc-reminder-action-btn--delete"
                    onClick={() => {
                      deleteReminder(reminder.id);
                      toast.info('Reminder removed');
                    }}
                    title="Delete Reminder"
                    aria-label="Delete Reminder"
                  >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder Modal */}
      <AddReminderModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </div>
  );
};

export default RemindersPage;
