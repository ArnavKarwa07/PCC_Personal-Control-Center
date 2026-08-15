import { create } from 'zustand';
import type { Alarm } from '../types';
import { alarmsApi } from '../services/api';
import { generateId } from '../utils';
import { soundEffects } from '../utils/audio';

interface AlarmStore {
  alarms: Alarm[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchAlarms: () => Promise<void>;
  addAlarm: (alarm: Omit<Alarm, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Alarm>;
  updateAlarm: (id: string, updates: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  duplicateAlarm: (id: string) => Promise<Alarm | undefined>;
  previewAlarmSound: (sound: string) => void;
  getNextAlarmText: () => string;
}

const STORAGE_KEY = 'pcc_alarms_store_v1';

const INITIAL_ALARMS: Alarm[] = [
  {
    id: 'alm-01',
    time: '06:30',
    label: 'Morning Sunlight & Hydration Wakeup',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    sound: 'radiant',
    snoozeMinutes: 10,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'alm-02',
    time: '08:45',
    label: 'Engineering Standup & Daily Calibration',
    enabled: true,
    days: [1, 2, 3, 4, 5], // Mon-Fri
    sound: 'digital',
    snoozeMinutes: 5,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'alm-03',
    time: '13:00',
    label: 'Post-Lunch Deep Work Sprint Start',
    enabled: false,
    days: [1, 2, 3, 4, 5],
    sound: 'gentle',
    snoozeMinutes: 10,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'alm-04',
    time: '22:30',
    label: 'Evening Blue-Light Wind Down & Sleep Routine',
    enabled: true,
    days: [0, 1, 2, 3, 4, 5, 6], // Everyday
    sound: 'gentle',
    snoozeMinutes: 15,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
];

const loadStoredAlarms = (): Alarm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load alarms from localStorage', err);
  }
  return INITIAL_ALARMS;
};

const saveAlarms = (alarms: Alarm[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
  } catch (err) {
    console.warn('Failed to save alarms to localStorage', err);
  }
};

export const useAlarmStore = create<AlarmStore>((set, get) => ({
  alarms: loadStoredAlarms(),
  isLoading: false,
  error: null,

  fetchAlarms: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverAlarms = await alarmsApi.getAll();
      if (serverAlarms && Array.isArray(serverAlarms) && serverAlarms.length > 0) {
        set({ alarms: serverAlarms, isLoading: false });
        saveAlarms(serverAlarms);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addAlarm: async (data) => {
    const now = new Date().toISOString();
    const newAlarm: Alarm = {
      ...data,
      id: generateId('alm'),
      sound: data.sound || 'radiant',
      snoozeMinutes: data.snoozeMinutes || 10,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await alarmsApi.create(newAlarm);
      if (created && created.id) {
        set((state) => {
          const updated = [...state.alarms, created];
          saveAlarms(updated);
          return { alarms: updated };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [...state.alarms, newAlarm];
      saveAlarms(updated);
      return { alarms: updated };
    });
    return newAlarm;
  },

  updateAlarm: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await alarmsApi.update(id, updates);
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.alarms.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: now } : a
      );
      saveAlarms(updated);
      return { alarms: updated };
    });
  },

  deleteAlarm: async (id) => {
    try {
      await alarmsApi.delete(id);
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.alarms.filter((a) => a.id !== id);
      saveAlarms(updated);
      return { alarms: updated };
    });
  },

  toggleAlarm: async (id) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (!alarm) return;

    const nextState = !alarm.enabled;
    soundEffects.playPip();

    try {
      await alarmsApi.toggle(id, nextState);
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.alarms.map((a) =>
        a.id === id ? { ...a, enabled: nextState, updatedAt: new Date().toISOString() } : a
      );
      saveAlarms(updated);
      return { alarms: updated };
    });
  },

  duplicateAlarm: async (id) => {
    const original = get().alarms.find((a) => a.id === id);
    if (!original) return undefined;

    return get().addAlarm({
      time: original.time,
      label: `${original.label} (Copy)`,
      enabled: true,
      days: [...original.days],
      sound: original.sound,
      snoozeMinutes: original.snoozeMinutes,
    });
  },

  previewAlarmSound: (sound: string) => {
    const pattern = sound === 'digital' ? 'digital' : sound === 'gentle' ? 'gentle' : 'radiant';
    soundEffects.playAlarm(pattern);
  },

  getNextAlarmText: () => {
    const enabledAlarms = get().alarms.filter((a) => a.enabled);
    if (enabledAlarms.length === 0) return 'No active alarms';

    // Simple nearest enabled alarm finder
    const sorted = [...enabledAlarms].sort((a, b) => a.time.localeCompare(b.time));
    return `Next at ${sorted[0].time} (${sorted[0].label})`;
  },
}));
