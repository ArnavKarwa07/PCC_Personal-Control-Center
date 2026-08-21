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
  editAlarm: (id: string, updates: Partial<Alarm>) => Promise<void>;
  deleteAlarm: (id: string) => Promise<void>;
  toggleAlarm: (id: string) => Promise<void>;
  duplicateAlarm: (id: string) => Promise<Alarm | undefined>;
  previewAlarmSound: (sound: string) => void;
  getNextAlarmText: () => string;
}

const STORAGE_KEY_V1 = 'pcc_alarms_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_alarms';

const loadStoredAlarms = (): Alarm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (a: any) =>
            a.label?.includes('Morning Sunlight') ||
            a.label?.includes('Engineering Standup') ||
            a.label?.includes('Post-Lunch Deep Work') ||
            a.label?.includes('Evening Blue-Light')
        );
        if (isLegacyMock) {
          localStorage.removeItem(STORAGE_KEY_V1);
          localStorage.removeItem(STORAGE_KEY_LEGACY);
          return [];
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed to load alarms from localStorage', err);
  }
  return [];
};

const saveAlarms = (alarms: Alarm[]) => {
  try {
    const data = JSON.stringify(alarms);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
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
      if (serverAlarms && Array.isArray(serverAlarms)) {
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

  editAlarm: async (id, updates) => {
    return get().updateAlarm(id, updates);
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
    return `Next at ${sorted[0].time}`;
  },
}));
