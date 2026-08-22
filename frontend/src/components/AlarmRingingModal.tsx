import React, { useEffect } from 'react';
import type { Alarm } from '../types';
import { soundEffects } from '../utils/audio';
import { Button } from './ui';
import './AlarmRingingModal.css';

interface AlarmRingingModalProps {
  alarm: Alarm | null;
  onDismiss: () => void;
  onSnooze: (minutes: number) => void;
}

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  onDismiss,
  onSnooze,
}) => {
  const onDismissRef = React.useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!alarm) return;

    // Start repeating alarm sound
    const pattern = alarm.sound === 'digital' ? 'digital' : alarm.sound === 'gentle' ? 'gentle' : 'radiant';
    const safePlay = () => {
      try {
        soundEffects.playAlarm(pattern);
      } catch (err) {
        console.warn('Audio playback restricted:', err);
      }
    };

    safePlay();
    const interval = setInterval(safePlay, 4000);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismissRef.current();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [alarm?.id, alarm?.sound]);

  if (!alarm) return null;

  let formattedTime = '00:00 AM';
  try {
    if (alarm.time && /^([01]?\d|2[0-3]):[0-5]\d$/.test(alarm.time)) {
      const [h, m] = alarm.time.split(':').map(Number);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) {
        const period = h >= 12 ? 'PM' : 'AM';
        const displayHour = h % 12 === 0 ? 12 : h % 12;
        formattedTime = `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
      }
    } else if (alarm.time) {
      formattedTime = alarm.time;
    }
  } catch {
    formattedTime = '00:00 AM';
  }

  return (
    <div
      className="pcc-alarm-ringing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Ringing Alarm"
    >
      <div className="pcc-alarm-ringing-card">
        <div className="pcc-alarm-ringing-icon-wrapper">
          <svg className="pcc-alarm-ringing-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3L2 6" />
            <path d="M22 6l-3-3" />
          </svg>
        </div>

        <h2 className="pcc-alarm-ringing-time">{formattedTime}</h2>
        <h3 className="pcc-alarm-ringing-label">{alarm.label || 'Alarm'}</h3>
        <p className="pcc-alarm-ringing-subtitle">Tone: {alarm.sound}</p>

        <div className="pcc-alarm-ringing-actions">
          <Button
            variant="secondary"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onSnooze(alarm.snoozeMinutes || 10);
            }}
            className="pcc-alarm-ringing-btn"
          >
            💤 Snooze ({alarm.snoozeMinutes || 10}m)
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={(e) => {
              e.stopPropagation();
              onDismissRef.current();
            }}
            className="pcc-alarm-ringing-btn pcc-alarm-ringing-btn--dismiss"
          >
            🔔 Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
};
