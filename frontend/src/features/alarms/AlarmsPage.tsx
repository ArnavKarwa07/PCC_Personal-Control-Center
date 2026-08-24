import React, { useState, useEffect } from 'react';
import { useAlarmStore } from '../../stores/alarmStore';
import { useToast } from '../../hooks/useToast';
import { Button, Badge, EmptyState } from '../../components/ui';
import { AddAlarmModal } from './AddAlarmModal';
import { EditAlarmModal } from './EditAlarmModal';
import { cn } from '../../utils';
import type { Alarm } from '../../types';
import './Alarms.css';

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']; // 0=Sun..6=Sat

export const AlarmsPage: React.FC = () => {
  const { alarms, fetchAlarms, isLoading, toggleAlarm, deleteAlarm, duplicateAlarm, previewAlarmSound, getNextAlarmText } =
    useAlarmStore();
  const { toast } = useToast();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState<Alarm | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchAlarms();
  }, [fetchAlarms]);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hoursStr = currentTime.toLocaleTimeString([], { hour: '2-digit', hour12: false });
  const minsStr = currentTime.toLocaleTimeString([], { minute: '2-digit' }).padStart(2, '0');
  const secsStr = currentTime.getSeconds().toString().padStart(2, '0');
  const dateStr = currentTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const nextAlarmText = getNextAlarmText();

  const formatAlarmTime = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    return {
      time: `${displayHour.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`,
      period,
    };
  };

  return (
    <div className="pcc-alarms-page">
      {/* Digital Clock Hero Display */}
      <div className="pcc-alarms-clock-hero">
        <div className="pcc-alarms-clock-hero__left">
          <div className="pcc-alarms-digital-clock">
            <span className="pcc-alarms-digital-clock__time">
              {hoursStr}:{minsStr}
            </span>
            <span className="pcc-alarms-digital-clock__seconds">:{secsStr}</span>
          </div>
          <div className="pcc-alarms-clock-hero__date">{dateStr}</div>
        </div>

        <div className="pcc-alarms-clock-hero__right">
          <div className="pcc-alarms-next-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="13" r="8" />
              <path d="M12 9v4l2 2" />
              <path d="M5 3L2 6" />
              <path d="M22 6l-3-3" />
            </svg>
            <span>{nextAlarmText}</span>
          </div>

          <Button
            id="btn-add-alarm"
            variant="primary"
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => setIsAddModalOpen(true)}
          >
            Set Alarm
          </Button>
        </div>
      </div>

      {/* Alarms Grid */}
      <div className="pcc-alarms-grid">
        {isLoading ? (
          <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1, 2].map((n) => (
              <div
                key={n}
                style={{ height: '180px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-xl)', opacity: 0.6 }}
              />
            ))}
          </div>
        ) : alarms.length === 0 ? (
          <div style={{ gridColumn: '1 / -1' }}>
            <EmptyState
              title="No alarms configured"
              description="Set smart wake schedules, morning routines, or interval alarms."
              actionLabel="Set Alarm"
              onAction={() => setIsAddModalOpen(true)}
            />
          </div>
        ) : (
          alarms.map((alarm: Alarm) => {
            const { time, period } = formatAlarmTime(alarm.time);

            return (
              <div
                key={alarm.id}
                id={`alarm-${alarm.id}`}
                className={cn('pcc-alarm-card', !alarm.enabled && 'pcc-alarm-card--disabled')}
              >
                <div className="pcc-alarm-card__header">
                  <div className="pcc-alarm-card__time-wrapper">
                    <span className="pcc-alarm-card__time">{time}</span>
                    <span className="pcc-alarm-card__ampm">{period}</span>
                  </div>

                  {/* Switch toggle */}
                  <label className="pcc-alarm-switch" aria-label={`Toggle alarm for ${alarm.label}`}>
                    <input
                      type="checkbox"
                      checked={alarm.enabled}
                      onChange={() => toggleAlarm(alarm.id)}
                    />
                    <span className="pcc-alarm-switch__slider" />
                  </label>
                </div>

                <div className="pcc-alarm-card__label">{alarm.label}</div>

                {/* Day Pills */}
                <div className="pcc-alarm-days">
                  {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                    const isActive = alarm.days.includes(dayNum);
                    return (
                      <div
                        key={dayNum}
                        className={cn(
                          'pcc-alarm-day-pill',
                          isActive && 'pcc-alarm-day-pill--active'
                        )}
                        title={['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayNum]}
                      >
                        {DAY_LETTERS[dayNum]}
                      </div>
                    );
                  })}
                </div>

                {/* Footer Controls */}
                <div className="pcc-alarm-card__footer">
                  <div className="pcc-alarm-card__meta-tags">
                    <Badge variant="default" size="sm" className="pcc-alarm-badge-icon">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 18V5l12-2v13" />
                        <circle cx="6" cy="18" r="3" />
                        <circle cx="18" cy="16" r="3" />
                      </svg>
                      <span>{alarm.sound}</span>
                    </Badge>
                    <Badge variant="default" size="sm" className="pcc-alarm-badge-icon">
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                      </svg>
                      <span>{alarm.snoozeMinutes}m</span>
                    </Badge>
                  </div>

                  <div className="pcc-alarm-card__actions">
                    <button
                      type="button"
                      className="pcc-alarm-btn pcc-alarm-btn--test"
                      onClick={() => {
                        previewAlarmSound(alarm.sound);
                        toast.info(`Testing tone: ${alarm.sound}`);
                      }}
                      title="Test Tone"
                      aria-label="Test Tone"
                    >
                      <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="pcc-alarm-btn pcc-alarm-btn--edit"
                      onClick={() => setEditingAlarm(alarm)}
                      title="Edit Alarm"
                      aria-label="Edit Alarm"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="pcc-alarm-btn"
                      onClick={async () => {
                        await duplicateAlarm(alarm.id);
                        toast.success('Alarm duplicated');
                      }}
                      title="Duplicate Alarm"
                      aria-label="Duplicate Alarm"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>

                    <button
                      type="button"
                      className="pcc-alarm-btn pcc-alarm-btn--delete"
                      onClick={() => {
                        deleteAlarm(alarm.id);
                        toast.info('Alarm deleted');
                      }}
                      title="Delete Alarm"
                      aria-label="Delete Alarm"
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Alarm Modal */}
      <AddAlarmModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Edit Alarm Modal */}
      <EditAlarmModal
        isOpen={!!editingAlarm}
        onClose={() => setEditingAlarm(null)}
        alarm={editingAlarm}
      />
    </div>
  );
};

export default AlarmsPage;
