import React, { useState } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { useReminderStore } from '../../stores/reminderStore';
import { useToast } from '../../hooks/useToast';
import type { ReminderPriority, ReminderRecurrence } from '../../types';

interface AddReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddReminderModal: React.FC<AddReminderModalProps> = ({ isOpen, onClose }) => {
  const { addReminder } = useReminderStore();
  const { toast } = useToast();

  const todayStr = '2026-08-15';
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState(todayStr);
  const [dueTime, setDueTime] = useState('14:00');
  const [priority, setPriority] = useState<ReminderPriority>('medium');
  const [recurrence, setRecurrence] = useState<ReminderRecurrence>('none');
  const [category, setCategory] = useState('Work');
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.warning('Please enter a reminder title');
      return;
    }

    setIsSubmitting(true);
    try {
      const tags = tagInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      await addReminder({
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate,
        dueTime,
        priority,
        completed: false,
        recurrence,
        category,
        tags,
      });

      toast.success(`Reminder "${title}" created`);
      onClose();
      // Reset form
      setTitle('');
      setNotes('');
      setDueDate(todayStr);
      setDueTime('14:00');
      setPriority('medium');
      setRecurrence('none');
      setCategory('Work');
      setTagInput('');
    } catch {
      toast.error('Failed to create reminder');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Reminder" size="md" id="add-reminder-modal">
      <form onSubmit={handleSubmit} className="pcc-reminder-form">
        <Input
          id="reminder-title"
          label="Reminder Title"
          placeholder="e.g. Call accountant regarding Q3 tax deductions"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />

        <div className="pcc-reminder-form__row">
          <Input
            id="reminder-date"
            label="Due Date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
          />
          <Input
            id="reminder-time"
            label="Due Time"
            type="time"
            value={dueTime}
            onChange={(e) => setDueTime(e.target.value)}
            required
          />
        </div>

        <div className="pcc-reminder-form__row">
          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label" htmlFor="reminder-priority">
              Priority
            </label>
            <select
              id="reminder-priority"
              className="pcc-reminder-form__select"
              value={priority}
              onChange={(e) => setPriority(e.target.value as ReminderPriority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label" htmlFor="reminder-recurrence">
              Recurrence
            </label>
            <select
              id="reminder-recurrence"
              className="pcc-reminder-form__select"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as ReminderRecurrence)}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <div className="pcc-reminder-form__row">
          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label" htmlFor="reminder-category">
              Category
            </label>
            <select
              id="reminder-category"
              className="pcc-reminder-form__select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="Work">Work</option>
              <option value="Health">Health</option>
              <option value="Finance">Finance</option>
              <option value="Personal">Personal</option>
              <option value="Home">Home</option>
            </select>
          </div>

          <Input
            id="reminder-tags"
            label="Tags (comma-separated)"
            placeholder="Focus, Routine, Bills"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
          />
        </div>

        <div className="pcc-reminder-form__group">
          <label className="pcc-reminder-form__label" htmlFor="reminder-notes">
            Notes / Instructions (optional)
          </label>
          <textarea
            id="reminder-notes"
            className="pcc-reminder-form__textarea"
            rows={3}
            placeholder="Add context, links, or specific checklist notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="pcc-reminder-form__footer">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Add Reminder
          </Button>
        </div>
      </form>
    </Modal>
  );
};
