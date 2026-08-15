import React, { useState } from 'react';
import { Modal, Button, Input } from '../../components/ui';
import { useAlarmStore } from '../../stores/alarmStore';
import { useToast } from '../../hooks/useToast';
import { soundEffects } from '../../utils/audio';

interface AddAlarmModalProps {
  isOpen: boolean;
  onClose: () => void;
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

export const AddAlarmModal: React.FC<AddAlarmModalProps> = ({ isOpen, onClose }) => {
  const { addAlarm, previewAlarmSound } = useAlarmStore();
  const { toast } = useToast();

  const [hours, setHours] = useState('07');
  const [minutes, setMinutes] = useState('00');
  const [label, setLabel] = useState('');
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
  const [sound, setSound] = useState('radiant');
  const [snoozeMinutes, setSnoozeMinutes] = useState(10);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    const formattedHours = hours.padStart(2, '0');
    const formattedMins = minutes.padStart(2, '0');
    const timeStr = `${formattedHours}:${formattedMins}`;

    setIsSubmitting(true);
    try {
      await addAlarm({
        time: timeStr,
        label: label.trim() || 'Scheduled Alarm',
        enabled: true,
        days: selectedDays,
        sound,
        snoozeMinutes,
      });

      toast.success(`Alarm set for ${timeStr}`);
      onClose();
      // Reset
      setHours('07');
      setMinutes('00');
      setLabel('');
      setSelectedDays([1, 2, 3, 4, 5]);
      setSound('radiant');
    } catch {
      toast.error('Failed to create alarm');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set New Alarm" size="md" id="add-alarm-modal">
      <form onSubmit={handleSubmit} className="pcc-alarm-form">
        {/* Big Time Selector */}
        <div className="pcc-alarm-time-inputs">
          <input
            id="alarm-hours-input"
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
          <span className="pcc-alarm-time-colon">:</span>
          <input
            id="alarm-minutes-input"
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
        </div>

        {/* Label */}
        <Input
          id="alarm-label-input"
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="pcc-reminder-form__label" htmlFor="alarm-sound">
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
                }}
                onClick={() => previewAlarmSound(sound)}
              >
                ▶ Test Tone
              </button>
            </div>
            <select
              id="alarm-sound"
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
            <label className="pcc-reminder-form__label" htmlFor="alarm-snooze">
              Snooze Duration
            </label>
            <select
              id="alarm-snooze"
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
            Set Alarm
          </Button>
        </div>
      </form>
    </Modal>
  );
};
