import React from 'react';
import { useCalendarStore } from '../../stores/calendarStore';
import { useToast } from '../../hooks/useToast';
import { CalendarEvent } from '../../types';
import { Modal, Badge, Button } from '../../components/ui';
import { formatDate } from '../../utils';

export interface EventDetailModalProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onClose: () => void;
}

export const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  isOpen,
  onClose,
}) => {
  const { deleteEvent, toggleEventCompleted } = useCalendarStore();
  const { addToast } = useToast();

  if (!event) return null;

  const handleDelete = async () => {
    await deleteEvent(event.id);
    addToast({
      type: 'error',
      title: 'Event Removed',
      message: `"${event.title}" has been deleted.`,
    });
    onClose();
  };

  const handleToggleDone = async () => {
    await toggleEventCompleted(event.id);
    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `"${event.title}" marked as ${event.completed ? 'pending' : 'completed'}.`,
    });
  };

  const formatTimeRange = () => {
    try {
      const start = new Date(event.startDate);
      const timeStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (event.endDate) {
        const end = new Date(event.endDate);
        const endTimeStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `${timeStr} - ${endTimeStr}`;
      }
      return timeStr;
    } catch {
      return event.startDate;
    }
  };

  const getTypeBadge = () => {
    switch (event.type) {
      case 'task':
        return <Badge variant="success">Task Deadline</Badge>;
      case 'reminder':
        return <Badge variant="warning">Reminder</Badge>;
      case 'event':
      default:
        return <Badge variant="accent">Calendar Event</Badge>;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          {getTypeBadge()}
          {event.priority && (
            <Badge variant={event.priority === 'urgent' ? 'error' : 'default'} size="sm">
              {event.priority}
            </Badge>
          )}
        </div>
      }
      size="md"
      id="event-detail-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete
          </Button>

          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            {(event.type === 'task' || event.type === 'reminder') && (
              <Button
                variant={event.completed ? 'secondary' : 'primary'}
                size="sm"
                onClick={handleToggleDone}
              >
                {event.completed ? 'Mark Incomplete' : 'Mark Completed'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--font-size-xl)', fontWeight: 'var(--font-weight-bold)', margin: '0 0 6px 0' }}>
            {event.title}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
              </svg>
              {formatDate(event.startDate)}
            </span>

            {!event.allDay && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                {formatTimeRange()}
              </span>
            )}
          </div>
        </div>

        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)' }}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--color-accent)" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>{event.location}</span>
          </div>
        )}

        <div style={{ padding: 'var(--space-3)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
            {event.description || 'No description provided.'}
          </p>
        </div>
      </div>
    </Modal>
  );
};
