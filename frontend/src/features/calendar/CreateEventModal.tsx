import React, { useState, useEffect } from 'react';
import { useCalendarStore } from '../../stores/calendarStore';
import { useToast } from '../../hooks/useToast';
import { CalendarEventType, Priority } from '../../types';
import { Modal, Input, Button } from '../../components/ui';

export interface CreateEventModalProps {
  isOpen: boolean;
  initialDate?: string; // YYYY-MM-DD
  onClose: () => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  initialDate,
  onClose,
}) => {
  const { addEvent } = useCalendarStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<CalendarEventType>('event');
  const [date, setDate] = useState(initialDate || '2026-08-15');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [allDay, setAllDay] = useState(false);
  const [priority, setPriority] = useState<Priority>('medium');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialDate) {
      setDate(initialDate);
    }
  }, [initialDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const startDateTime = allDay ? `${date}T00:00:00` : `${date}T${startTime}:00`;
    const endDateTime = allDay || !endTime ? undefined : `${date}T${endTime}:00`;

    try {
      await addEvent({
        title: title.trim(),
        type,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay,
        priority,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        completed: false,
      });

      addToast({
        type: 'success',
        title: 'Event Scheduled',
        message: `"${title}" was added to calendar.`,
      });

      // Reset
      setTitle('');
      setType('event');
      setLocation('');
      setDescription('');
      onClose();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not create event. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Schedule Event / Task / Reminder"
      size="md"
      id="create-event-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Add to Schedule
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input
          id="event-title"
          label="Title *"
          placeholder="e.g. Core Engineering Sprint..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="event-type">
              Type
            </label>
            <select
              id="event-type"
              className="pcc-input__field"
              value={type}
              onChange={(e) => setType(e.target.value as CalendarEventType)}
            >
              <option value="event">Calendar Event / Meeting</option>
              <option value="task">Task Deadline</option>
              <option value="reminder">Reminder Marker</option>
            </select>
          </div>

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="event-priority">
              Priority
            </label>
            <select
              id="event-priority"
              className="pcc-input__field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            id="event-date"
            type="date"
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />

          <Input
            id="event-start-time"
            type="time"
            label="Start Time"
            value={startTime}
            disabled={allDay}
            onChange={(e) => setStartTime(e.target.value)}
          />

          <Input
            id="event-end-time"
            type="time"
            label="End Time"
            value={endTime}
            disabled={allDay}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            id="event-all-day"
            type="checkbox"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            style={{ accentColor: 'var(--color-accent)' }}
          />
          <label htmlFor="event-all-day" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', cursor: 'pointer' }}>
            All-day block / deadline marker
          </label>
        </div>

        <Input
          id="event-location"
          label="Location or Meeting URL"
          placeholder="e.g. Google Meet, Terminal, Office"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <div className="pcc-input-wrapper">
          <label className="pcc-input__label" htmlFor="event-desc">
            Notes & Details
          </label>
          <textarea
            id="event-desc"
            className="pcc-input__field"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </form>
    </Modal>
  );
};
