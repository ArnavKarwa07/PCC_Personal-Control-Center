import React, { useState, useEffect } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { useAlarmStore } from '../../stores/alarmStore';
import { useToast } from '../../hooks/useToast';
import { soundEffects } from '../../utils/audio';
import type { Alarm } from '../../types';

interface EditAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  alarm: Alarm | null;
}

const DAY_LABELS = [
  { day: 1, label: 'M', name: 'Mon' },
  { day: 2, label: 'T', name: 'Tue' },
  { day: 3, label: 'W', name: 'Wed' },
  { day: 4, label: 'T', name: 'Thu' },
  { day: 5, label: 'F', name: 'Fri' },
  { day: 6, label: 'S', name: 'Sat' },
  { day: 0, label: 'S', name: 'Sun' },
];

export const EditAlarmModal: React.FC<EditAlarmModalProps> = ({ isOpen, onClose, alarm }) => {
  const { editAlarm, previewAlarmSound } = useAlarmStore();
  const { toast } = useToast();

  const [hours, setHours] = useState('07');
  const [minutes, setMinutes] = useState('00');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [sound, setSound] = useState('radiant');
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (alarm) {
      const [h, m] = alarm.time.split(':');
      setHours(h || '07');
      setMinutes(m || '00');
      setLabel(alarm.label || '');
      setSelectedDays(alarm.days || [1, 2, 3, 4, 5]);
      setSound(alarm.sound || 'radiant');
      setSnoozeMinutes(alarm.snoozeMinutes || 10);
    }
  }, [alarm]);

  const toggleDay = (day: number) => {
    soundEffects.playPip();
    if (selectedDays.includes(day)) {
      if (selectedDays.length === 1) {
        toast.warning('Alarm must have at least one day selected');
        return;
      }
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const handleSetPreset = (preset: 'weekdays' | 'weekends' | 'everyday') => {
    soundEffects.playPip();
    if (preset === 'weekdays') setSelectedDays([1, 2, 3, 4, 5]);
    else if (preset === 'weekends') setSelectedDays([6, 0]);
    else setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alarm) return;

    const formattedHours = hours.padStart(2, '0');
    const formattedMins = minutes.padStart(2, '0');
    const timeStr = `${formattedHours}:${formattedMins}`;

    setIsSubmitting(true);
    try {
      await editAlarm(alarm.id, {
        time: timeStr,
        label: label.trim() || 'Scheduled Alarm',
        days: selectedDays,
        sound,
        snoozeMinutes,
      });

      toast.success(`Alarm updated for ${timeStr}`);
      onClose();
    } catch {
      toast.error('Failed to update alarm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepHours = (delta: number) => {
    const current = parseInt(hours, 10) || 0;
    const next = (current + delta + 24) % 24;
    setHours(next.toString().padStart(2, '0'));
    soundEffects.playPip();
  };

  const stepMinutes = (delta: number) => {
    const current = parseInt(minutes, 10) || 0;
    const next = (current + delta + 60) % 60;
    setMinutes(next.toString().padStart(2, '0'));
    soundEffects.playPip();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Alarm" size="md" id="edit-alarm-modal">
      <form onSubmit={handleSubmit} className="pcc-alarm-form">
        {/* Big Time Selector with Top & Bottom Centered Stepper Arrows */}
        <div className="pcc-alarm-time-inputs">
          <div className="pcc-alarm-time-spinner">
            <button
              type="button"
              className="pcc-alarm-time-stepper-btn pcc-alarm-time-stepper-btn--up"
              onClick={() => stepHours(1)}
              aria-label="Increase Hours"
              title="Increase Hours"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <input
              id="edit-alarm-hours-input"
              className="pcc-alarm-time-digit"
              type="number"
              min="0"
              max="23"
              value={hours}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 2) setHours(val);
              }}
              onBlur={() => setHours(hours.padStart(2, '0'))}
              required
            />
            <button
              type="button"
              className="pcc-alarm-time-stepper-btn pcc-alarm-time-stepper-btn--down"
              onClick={() => stepHours(-1)}
              aria-label="Decrease Hours"
              title="Decrease Hours"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>

          <span className="pcc-alarm-time-colon">:</span>

          <div className="pcc-alarm-time-spinner">
            <button
              type="button"
              className="pcc-alarm-time-stepper-btn pcc-alarm-time-stepper-btn--up"
              onClick={() => stepMinutes(1)}
              aria-label="Increase Minutes"
              title="Increase Minutes"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
            <input
              id="edit-alarm-minutes-input"
              className="pcc-alarm-time-digit"
              type="number"
              min="0"
              max="59"
              value={minutes}
              onChange={(e) => {
                const val = e.target.value;
                if (val.length <= 2) setMinutes(val);
              }}
              onBlur={() => setMinutes(minutes.padStart(2, '0'))}
              required
            />
            <button
              type="button"
              className="pcc-alarm-time-stepper-btn pcc-alarm-time-stepper-btn--down"
              onClick={() => stepMinutes(-1)}
              aria-label="Decrease Minutes"
              title="Decrease Minutes"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        </div>

        {/* Label */}
        <Input
          id="edit-alarm-label-input"
          label="Alarm Label"
          placeholder="e.g. Morning Routine, Deep Work Session"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
        />

        {/* Day Selector */}
        <div className="pcc-reminder-form__group">
          <label className="pcc-reminder-form__label">Repeat on Days</label>
          <div className="pcc-alarm-day-selector">
            {DAY_LABELS.map(({ day, label: dayLetter, name }) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  className={`pcc-alarm-day-toggle-btn ${
                    isSelected ? 'pcc-alarm-day-toggle-btn--active' : ''
                  }`}
                  onClick={() => toggleDay(day)}
                  title={name}
                >
                  {dayLetter}
                </button>
              );
            })}
          </div>

          <div className="pcc-alarm-quick-day-presets">
            <button
              type="button"
              className="pcc-alarm-preset-pill"
              onClick={() => handleSetPreset('weekdays')}
            >
              Weekdays
            </button>
            <button
              type="button"
              className="pcc-alarm-preset-pill"
              onClick={() => handleSetPreset('weekends')}
            >
              Weekends
            </button>
            <button
              type="button"
              className="pcc-alarm-preset-pill"
              onClick={() => handleSetPreset('everyday')}
            >
              Everyday
            </button>
          </div>
        </div>

        {/* Sound and Snooze row */}
        <div className="pcc-reminder-form__row">
          <div className="pcc-reminder-form__group">
            <div className="pcc-reminder-form__label-header">
              <label className="pcc-reminder-form__label" htmlFor="edit-alarm-sound">
                Alarm Tone
              </label>
              <button
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-accent-hover)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontWeight: 600,
                }}
                onClick={() => previewAlarmSound(sound)}
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                Test Tone
              </button>
            </div>
            <select
              id="edit-alarm-sound"
              className="pcc-reminder-form__select"
              value={sound}
              onChange={(e) => setSound(e.target.value)}
            >
              <option value="radiant">Radiant Bell</option>
              <option value="gentle">Gentle Chime</option>
              <option value="digital">Digital Pulse</option>
            </select>
          </div>

          <div className="pcc-reminder-form__group">
            <div className="pcc-reminder-form__label-header">
              <label className="pcc-reminder-form__label" htmlFor="edit-alarm-snooze">
                Snooze Duration
              </label>
            </div>
            <select
              id="edit-alarm-snooze"
              className="pcc-reminder-form__select"
              value={snoozeMinutes}
              onChange={(e) => setSnoozeMinutes(Number(e.target.value))}
            >
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={20}>20 minutes</option>
            </select>
          </div>
        </div>

        <div className="pcc-reminder-form__footer">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
