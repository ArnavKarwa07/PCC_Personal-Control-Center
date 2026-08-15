import { create } from 'zustand';
import type { TimerMode, PomodoroState, StopwatchLap } from '../types';
import { soundEffects } from '../utils/audio';

interface TimerStore {
  activeTab: TimerMode;
  setActiveTab: (tab: TimerMode) => void;

  // --- Pomodoro State ---
  pomodoroState: PomodoroState;
  pomodoroTimeLeft: number; // in seconds
  pomodoroWorkDuration: number; // 25 * 60
  pomodoroShortBreakDuration: number; // 5 * 60
  pomodoroLongBreakDuration: number; // 15 * 60
  isPomodoroRunning: boolean;
  pomodoroCompletedCount: number;
  sessionsBeforeLongBreak: number;
  autoSwitchPomodoro: boolean;

  // Pomodoro Actions
  startPomodoro: () => void;
  pausePomodoro: () => void;
  resetPomodoro: () => void;
  skipPomodoro: () => void;
  setPomodoroDurations: (workMins: number, shortBreakMins: number, longBreakMins: number) => void;
  tickPomodoro: () => void;

  // --- Countdown Timer State ---
  countdownDuration: number; // in seconds
  countdownTimeLeft: number; // in seconds
  isCountdownRunning: boolean;
  countdownLabel: string;

  // Countdown Actions
  setCountdownDuration: (seconds: number, label?: string) => void;
  startCountdown: () => void;
  pauseCountdown: () => void;
  resetCountdown: () => void;
  addCountdownSeconds: (seconds: number) => void;
  setCountdownLabel: (label: string) => void;
  tickCountdown: () => void;

  // --- Stopwatch State ---
  stopwatchTime: number; // in milliseconds
  isStopwatchRunning: boolean;
  laps: StopwatchLap[];

  // Stopwatch Actions
  startStopwatch: () => void;
  pauseStopwatch: () => void;
  resetStopwatch: () => void;
  recordLap: () => void;
  tickStopwatch: (elapsedMs: number) => void;
}

const DEFAULT_WORK_SECONDS = 25 * 60;
const DEFAULT_SHORT_BREAK = 5 * 60;
const DEFAULT_LONG_BREAK = 15 * 60;
const DEFAULT_COUNTDOWN = 10 * 60;

export const useTimerStore = create<TimerStore>((set, get) => ({
  activeTab: 'pomodoro',
  setActiveTab: (activeTab) => set({ activeTab }),

  // Pomodoro
  pomodoroState: 'work',
  pomodoroTimeLeft: DEFAULT_WORK_SECONDS,
  pomodoroWorkDuration: DEFAULT_WORK_SECONDS,
  pomodoroShortBreakDuration: DEFAULT_SHORT_BREAK,
  pomodoroLongBreakDuration: DEFAULT_LONG_BREAK,
  isPomodoroRunning: false,
  pomodoroCompletedCount: 0,
  sessionsBeforeLongBreak: 4,
  autoSwitchPomodoro: true,

  startPomodoro: () => {
    soundEffects.playPip();
    set({ isPomodoroRunning: true });
  },

  pausePomodoro: () => {
    soundEffects.playPip();
    set({ isPomodoroRunning: false });
  },

  resetPomodoro: () => {
    const { pomodoroState, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration } = get();
    let initialTime = pomodoroWorkDuration;
    if (pomodoroState === 'short_break') initialTime = pomodoroShortBreakDuration;
    if (pomodoroState === 'long_break') initialTime = pomodoroLongBreakDuration;
    set({
      pomodoroTimeLeft: initialTime,
      isPomodoroRunning: false,
    });
  },

  skipPomodoro: () => {
    const { pomodoroState, pomodoroCompletedCount, sessionsBeforeLongBreak, pomodoroWorkDuration, pomodoroShortBreakDuration, pomodoroLongBreakDuration } = get();

    let nextState: PomodoroState = 'work';
    let nextCount = pomodoroCompletedCount;
    let nextTime = pomodoroWorkDuration;

    if (pomodoroState === 'work') {
      nextCount = pomodoroCompletedCount + 1;
      if (nextCount % sessionsBeforeLongBreak === 0) {
        nextState = 'long_break';
        nextTime = pomodoroLongBreakDuration;
      } else {
        nextState = 'short_break';
        nextTime = pomodoroShortBreakDuration;
      }
    } else {
      nextState = 'work';
      nextTime = pomodoroWorkDuration;
    }

    soundEffects.playChime();
    set({
      pomodoroState: nextState,
      pomodoroCompletedCount: nextCount,
      pomodoroTimeLeft: nextTime,
      isPomodoroRunning: false,
    });
  },

  setPomodoroDurations: (workMins, shortBreakMins, longBreakMins) => {
    const w = workMins * 60;
    const s = shortBreakMins * 60;
    const l = longBreakMins * 60;
    set((state) => ({
      pomodoroWorkDuration: w,
      pomodoroShortBreakDuration: s,
      pomodoroLongBreakDuration: l,
      pomodoroTimeLeft:
        state.pomodoroState === 'work' ? w : state.pomodoroState === 'short_break' ? s : l,
    }));
  },

  tickPomodoro: () => {
    const { pomodoroTimeLeft, isPomodoroRunning } = get();
    if (!isPomodoroRunning) return;

    if (pomodoroTimeLeft <= 1) {
      soundEffects.playTimerComplete();
      get().skipPomodoro();
      return;
    }

    set({ pomodoroTimeLeft: pomodoroTimeLeft - 1 });
  },

  // Countdown
  countdownDuration: DEFAULT_COUNTDOWN,
  countdownTimeLeft: DEFAULT_COUNTDOWN,
  isCountdownRunning: false,
  countdownLabel: 'Deep Focus Sprint',

  setCountdownDuration: (seconds, label) => {
    set({
      countdownDuration: seconds,
      countdownTimeLeft: seconds,
      isCountdownRunning: false,
      countdownLabel: label || get().countdownLabel,
    });
  },

  startCountdown: () => {
    soundEffects.playPip();
    set({ isCountdownRunning: true });
  },

  pauseCountdown: () => {
    soundEffects.playPip();
    set({ isCountdownRunning: false });
  },

  resetCountdown: () => {
    set((state) => ({
      countdownTimeLeft: state.countdownDuration,
      isCountdownRunning: false,
    }));
  },

  addCountdownSeconds: (seconds) => {
    set((state) => {
      const nextTime = state.countdownTimeLeft + seconds;
      const nextDuration = Math.max(state.countdownDuration, nextTime);
      return {
        countdownTimeLeft: nextTime,
        countdownDuration: nextDuration,
      };
    });
  },

  setCountdownLabel: (countdownLabel) => set({ countdownLabel }),

  tickCountdown: () => {
    const { countdownTimeLeft, isCountdownRunning } = get();
    if (!isCountdownRunning) return;

    if (countdownTimeLeft <= 1) {
      soundEffects.playTimerComplete();
      set({
        countdownTimeLeft: 0,
        isCountdownRunning: false,
      });
      return;
    }

    set({ countdownTimeLeft: countdownTimeLeft - 1 });
  },

  // Stopwatch
  stopwatchTime: 0,
  isStopwatchRunning: false,
  laps: [],

  startStopwatch: () => {
    soundEffects.playPip();
    set({ isStopwatchRunning: true });
  },

  pauseStopwatch: () => {
    soundEffects.playPip();
    set({ isStopwatchRunning: false });
  },

  resetStopwatch: () => {
    set({
      stopwatchTime: 0,
      isStopwatchRunning: false,
      laps: [],
    });
  },

  recordLap: () => {
    const { stopwatchTime, laps } = get();
    if (stopwatchTime === 0) return;

    soundEffects.playPip();
    const lastLapTime = laps.length > 0 ? laps[0].overallTime : 0;
    const lapDuration = stopwatchTime - lastLapTime;

    const newLap: StopwatchLap = {
      lapNumber: laps.length + 1,
      lapTime: lapDuration,
      overallTime: stopwatchTime,
      timestamp: Date.now(),
    };

    set({ laps: [newLap, ...laps] });
  },

  tickStopwatch: (elapsedMs) => {
    const { isStopwatchRunning, stopwatchTime } = get();
    if (!isStopwatchRunning) return;
    set({ stopwatchTime: stopwatchTime + elapsedMs });
  },
}));
