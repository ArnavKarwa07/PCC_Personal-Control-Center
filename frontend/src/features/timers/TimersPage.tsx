import React, { useEffect, useRef, useState } from 'react';
import { useTimerStore } from '../../stores/timerStore';
import { useToast } from '../../hooks/useToast';
import { Button, Badge } from '../../components/ui';
import { cn } from '../../utils';
import './Timers.css';

export const TimersPage: React.FC = () => {
  const {
    activeTab,
    setActiveTab,

    // Pomodoro
    pomodoroState,
    pomodoroTimeLeft,
    pomodoroWorkDuration,
    pomodoroShortBreakDuration,
    pomodoroLongBreakDuration,
    isPomodoroRunning,
    pomodoroCompletedCount,
    sessionsBeforeLongBreak,
    startPomodoro,
    pausePomodoro,
    resetPomodoro,
    skipPomodoro,
    setPomodoroDurations,
    tickPomodoro,

    // Countdown
    countdownDuration,
    countdownTimeLeft,
    isCountdownRunning,
    countdownLabel,
    setCountdownDuration,
    startCountdown,
    pauseCountdown,
    resetCountdown,
    addCountdownSeconds,
    tickCountdown,

    // Stopwatch
    stopwatchTime,
    isStopwatchRunning,
    laps,
    startStopwatch,
    pauseStopwatch,
    resetStopwatch,
    recordLap,
    tickStopwatch,
  } = useTimerStore();

  const { toast } = useToast();

  // Custom countdown inputs
  const [customHours, setCustomHours] = useState(0);
  const [customMins, setCustomMins] = useState(15);
  const [customSecs, setCustomSecs] = useState(0);
  const [isEditingCustom, setIsEditingCustom] = useState(false);

  // Stopwatch high-resolution tick animation frame
  const stopwatchLastTimeRef = useRef<number | null>(null);

  // Ticking effect for Pomodoro and Countdown (1-second intervals)
  useEffect(() => {
    const interval = setInterval(() => {
      if (isPomodoroRunning) {
        tickPomodoro();
      }
      if (isCountdownRunning) {
        tickCountdown();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isPomodoroRunning, isCountdownRunning, tickPomodoro, tickCountdown]);

  // Stopwatch animation frame ticker
  useEffect(() => {
    let animId: number;

    const loop = (timestamp: number) => {
      if (isStopwatchRunning) {
        if (stopwatchLastTimeRef.current !== null) {
          const delta = timestamp - stopwatchLastTimeRef.current;
          tickStopwatch(delta);
        }
        stopwatchLastTimeRef.current = timestamp;
        animId = requestAnimationFrame(loop);
      }
    };

    if (isStopwatchRunning) {
      stopwatchLastTimeRef.current = performance.now();
      animId = requestAnimationFrame(loop);
    } else {
      stopwatchLastTimeRef.current = null;
    }

    return () => cancelAnimationFrame(animId);
  }, [isStopwatchRunning, tickStopwatch]);

  // Format MM:SS
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Format Stopwatch time HH:MM:SS.ms
  const formatStopwatch = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const hundredths = Math.floor((ms % 1000) / 10);

    const timeMain = `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${mins
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    const timeMs = `.${hundredths.toString().padStart(2, '0')}`;

    return { timeMain, timeMs };
  };

  // SVG Progress Ring calculations
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  const getPomodoroProgress = () => {
    let max = pomodoroWorkDuration;
    if (pomodoroState === 'short_break') max = pomodoroShortBreakDuration;
    if (pomodoroState === 'long_break') max = pomodoroLongBreakDuration;
    const fraction = Math.max(0, Math.min(1, pomodoroTimeLeft / max));
    return circumference - fraction * circumference;
  };

  const getCountdownProgress = () => {
    const fraction = Math.max(0, Math.min(1, countdownTimeLeft / (countdownDuration || 1)));
    return circumference - fraction * circumference;
  };

  // Fastest/Slowest laps for Stopwatch
  const lapTimes = laps.map((l) => l.lapTime);
  const minLap = lapTimes.length > 1 ? Math.min(...lapTimes) : -1;
  const maxLap = lapTimes.length > 1 ? Math.max(...lapTimes) : -1;

  const handleApplyCustomCountdown = (e: React.FormEvent) => {
    e.preventDefault();
    const totalSecs = customHours * 3600 + customMins * 60 + customSecs;
    if (totalSecs <= 0) {
      toast.warning('Please enter a duration greater than 0');
      return;
    }
    setCountdownDuration(totalSecs, 'Custom Timer');
    setIsEditingCustom(false);
    toast.success(`Timer set to ${formatTime(totalSecs)}`);
  };

  return (
    <div className="pcc-timers-page">
      {/* Header */}
      <div className="pcc-timers-header">
        <h1>Timers</h1>
      </div>

      {/* Navigation Switcher */}
      <div className="pcc-timers-nav">
        <button
          type="button"
          className={cn('pcc-timers-nav-btn', activeTab === 'pomodoro' && 'pcc-timers-nav-btn--active')}
          onClick={() => setActiveTab('pomodoro')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Pomodoro
        </button>

        <button
          type="button"
          className={cn('pcc-timers-nav-btn', activeTab === 'countdown' && 'pcc-timers-nav-btn--active')}
          onClick={() => setActiveTab('countdown')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3L2 6" />
            <path d="M22 6l-3-3" />
          </svg>
          Timer
        </button>

        <button
          type="button"
          className={cn('pcc-timers-nav-btn', activeTab === 'stopwatch' && 'pcc-timers-nav-btn--active')}
          onClick={() => setActiveTab('stopwatch')}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="2" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="22" />
            <circle cx="12" cy="12" r="7" />
          </svg>
          Stopwatch
        </button>
      </div>

      {/* SVG Definitions for Gradients */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="timerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#a855f7" />
          </linearGradient>
        </defs>
      </svg>

      {/* TAB 1: POMODORO */}
      {activeTab === 'pomodoro' && (
        <div className="pcc-timer-container">
          {/* Circular Progress Ring */}
          <div className="pcc-timer-ring-wrapper">
            <svg className="pcc-timer-svg" viewBox="0 0 280 280">
              <circle className="pcc-timer-svg__bg" cx="140" cy="140" r={radius} />
              <circle
                className={cn(
                  'pcc-timer-svg__progress',
                  pomodoroState !== 'work' && 'pcc-timer-svg__progress--break'
                )}
                cx="140"
                cy="140"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={getPomodoroProgress()}
              />
            </svg>

            <div className="pcc-timer-ring-center">
              <span className="pcc-timer-ring-time">{formatTime(pomodoroTimeLeft)}</span>
              <span
                className={cn(
                  'pcc-timer-ring-state',
                  pomodoroState !== 'work' && 'pcc-timer-ring-state--break'
                )}
              >
                {pomodoroState === 'work'
                  ? 'Deep Work'
                  : pomodoroState === 'short_break'
                  ? 'Short Break'
                  : 'Long Break'}
              </span>
              <span className="pcc-timer-ring-label">
                Session {(pomodoroCompletedCount % sessionsBeforeLongBreak) + 1} of{' '}
                {sessionsBeforeLongBreak}
              </span>
            </div>
          </div>

          {/* Session Progress Dots */}
          <div className="pcc-pomodoro-cycles">
            {Array.from({ length: sessionsBeforeLongBreak }).map((_, idx) => {
              const currentActiveIdx = pomodoroCompletedCount % sessionsBeforeLongBreak;
              const isDone = idx < currentActiveIdx;
              const isCurrent = idx === currentActiveIdx;

              return (
                <div
                  key={idx}
                  className={cn(
                    'pcc-pomodoro-dot',
                    isDone && 'pcc-pomodoro-dot--completed',
                    isCurrent && isPomodoroRunning && 'pcc-pomodoro-dot--active'
                  )}
                  title={`Session ${idx + 1}`}
                />
              );
            })}
          </div>

          {/* Controls */}
          <div className="pcc-timer-controls">
            <button
              type="button"
              id="btn-pomodoro-toggle"
              className="pcc-timer-btn-primary"
              onClick={isPomodoroRunning ? pausePomodoro : startPomodoro}
            >
              {isPomodoroRunning ? (
                <>
                  <span>⏸</span> Pause
                </>
              ) : (
                <>
                  <span>▶</span> Start Focus
                </>
              )}
            </button>

            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={resetPomodoro}
              title="Reset current interval"
            >
              <span>↺</span> Reset
            </button>

            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={skipPomodoro}
              title="Skip to next cycle"
            >
              <span>⏭</span> Skip
            </button>
          </div>

          {/* Duration Presets */}
          <div className="pcc-timer-presets">
            <button
              type="button"
              className={cn(
                'pcc-timer-preset-btn',
                pomodoroWorkDuration === 15 * 60 && 'pcc-timer-preset-btn--active'
              )}
              onClick={() => setPomodoroDurations(15, 3, 10)}
            >
              15m Work / 3m Break
            </button>
            <button
              type="button"
              className={cn(
                'pcc-timer-preset-btn',
                pomodoroWorkDuration === 25 * 60 && 'pcc-timer-preset-btn--active'
              )}
              onClick={() => setPomodoroDurations(25, 5, 15)}
            >
              25m Work / 5m Break (Classic)
            </button>
            <button
              type="button"
              className={cn(
                'pcc-timer-preset-btn',
                pomodoroWorkDuration === 50 * 60 && 'pcc-timer-preset-btn--active'
              )}
              onClick={() => setPomodoroDurations(50, 10, 20)}
            >
              50m Work / 10m Break (Ultradian)
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: TIMER */}
      {activeTab === 'countdown' && (
        <div className="pcc-timer-container">
          <div className="pcc-timer-ring-wrapper">
            <svg className="pcc-timer-svg" viewBox="0 0 280 280">
              <circle className="pcc-timer-svg__bg" cx="140" cy="140" r={radius} />
              <circle
                className="pcc-timer-svg__progress"
                cx="140"
                cy="140"
                r={radius}
                strokeDasharray={circumference}
                strokeDashoffset={getCountdownProgress()}
              />
            </svg>

            <div className="pcc-timer-ring-center">
              <span className="pcc-timer-ring-time">{formatTime(countdownTimeLeft)}</span>
              <span className="pcc-timer-ring-state">{countdownLabel}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="pcc-timer-controls">
            <button
              type="button"
              id="btn-countdown-toggle"
              className="pcc-timer-btn-primary"
              onClick={isCountdownRunning ? pauseCountdown : startCountdown}
            >
              {isCountdownRunning ? (
                <>
                  <span>⏸</span> Pause
                </>
              ) : (
                <>
                  <span>▶</span> Start
                </>
              )}
            </button>

            <button type="button" className="pcc-timer-btn-secondary" onClick={resetCountdown}>
              <span>↺</span> Reset
            </button>

            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={() => addCountdownSeconds(60)}
            >
              +1m
            </button>
            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={() => addCountdownSeconds(300)}
            >
              +5m
            </button>
          </div>

          {/* Presets */}
          <div className="pcc-timer-presets">
            {[
              { label: '5 min', secs: 5 * 60 },
              { label: '10 min', secs: 10 * 60 },
              { label: '15 min', secs: 15 * 60 },
              { label: '30 min', secs: 30 * 60 },
              { label: '45 min', secs: 45 * 60 },
              { label: '60 min', secs: 60 * 60 },
            ].map((preset) => (
              <button
                key={preset.secs}
                type="button"
                className={cn(
                  'pcc-timer-preset-btn',
                  countdownDuration === preset.secs && 'pcc-timer-preset-btn--active'
                )}
                onClick={() => setCountdownDuration(preset.secs, `${preset.label} Timer`)}
              >
                {preset.label}
              </button>
            ))}
            <button
              type="button"
              className="pcc-timer-preset-btn"
              onClick={() => setIsEditingCustom(!isEditingCustom)}
            >
              ⚙ Custom
            </button>
          </div>

          {/* Custom Time Form */}
          {isEditingCustom && (
            <form onSubmit={handleApplyCustomCountdown} style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
              <input
                type="number"
                min="0"
                max="23"
                className="pcc-alarm-time-digit"
                style={{ width: '50px', height: '40px', fontSize: '1rem' }}
                value={customHours}
                onChange={(e) => setCustomHours(Number(e.target.value))}
                placeholder="HH"
                aria-label="Hours"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="pcc-alarm-time-digit"
                style={{ width: '50px', height: '40px', fontSize: '1rem' }}
                value={customMins}
                onChange={(e) => setCustomMins(Number(e.target.value))}
                placeholder="MM"
                aria-label="Minutes"
              />
              <span>:</span>
              <input
                type="number"
                min="0"
                max="59"
                className="pcc-alarm-time-digit"
                style={{ width: '50px', height: '40px', fontSize: '1rem' }}
                value={customSecs}
                onChange={(e) => setCustomSecs(Number(e.target.value))}
                placeholder="SS"
                aria-label="Seconds"
              />
              <Button size="sm" variant="primary" type="submit">
                Apply
              </Button>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: STOPWATCH */}
      {activeTab === 'stopwatch' && (
        <div className="pcc-timer-container">
          <div className="pcc-stopwatch-display">
            {formatStopwatch(stopwatchTime).timeMain}
            <span className="pcc-stopwatch-display__ms">
              {formatStopwatch(stopwatchTime).timeMs}
            </span>
          </div>

          {/* Controls */}
          <div className="pcc-timer-controls">
            <button
              type="button"
              id="btn-stopwatch-toggle"
              className="pcc-timer-btn-primary"
              onClick={isStopwatchRunning ? pauseStopwatch : startStopwatch}
            >
              {isStopwatchRunning ? (
                <>
                  <span>⏸</span> Stop
                </>
              ) : (
                <>
                  <span>▶</span> Start
                </>
              )}
            </button>

            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={recordLap}
              disabled={!isStopwatchRunning}
            >
              <span>🏁</span> Lap
            </button>

            <button
              type="button"
              className="pcc-timer-btn-secondary"
              onClick={resetStopwatch}
              disabled={stopwatchTime === 0}
            >
              <span>↺</span> Reset
            </button>
          </div>

          {/* Laps Table */}
          {laps.length > 0 && (
            <div className="pcc-stopwatch-laps-wrapper">
              <div className="pcc-stopwatch-laps-header">
                <span>Lap</span>
                <span>Lap Time</span>
                <span>Overall</span>
              </div>

              <div className="pcc-stopwatch-laps-list">
                {laps.map((lap) => {
                  const isFastest = lap.lapTime === minLap;
                  const isSlowest = lap.lapTime === maxLap;

                  const formattedLap = formatStopwatch(lap.lapTime);
                  const formattedOverall = formatStopwatch(lap.overallTime);

                  return (
                    <div
                      key={lap.lapNumber}
                      className={cn(
                        'pcc-stopwatch-lap-item',
                        isFastest && 'pcc-stopwatch-lap-item--fastest',
                        isSlowest && 'pcc-stopwatch-lap-item--slowest'
                      )}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                        <span>#{lap.lapNumber.toString().padStart(2, '0')}</span>
                        {isFastest && <Badge variant="success" size="sm">Fastest</Badge>}
                        {isSlowest && <Badge variant="error" size="sm">Slowest</Badge>}
                      </div>

                      <span>
                        +{formattedLap.timeMain}
                        {formattedLap.timeMs}
                      </span>

                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {formattedOverall.timeMain}
                        {formattedOverall.timeMs}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimersPage;
