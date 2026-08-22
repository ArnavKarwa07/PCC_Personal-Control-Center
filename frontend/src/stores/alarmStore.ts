import { syncQueue } from '../services/syncQueue';
import { create } from 'zustand';
import type { Alarm } from '../types';
import { alarmsApi } from '../services/api';
import { generateId } from '../utils';
import { soundEffects } from '../utils/audio';
import { alarmScheduler } from '../services/alarmScheduler';

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
  snoozeAlarm: (id: string, minutes: number) => Promise<void>;
  duplicateAlarm: (id: string) => Promise<Alarm | undefined>;
  previewAlarmSound: (sound: string) => void;
  getNextAlarmText: () => string;
}

const STORAGE_KEY_V1 = 'pcc_alarms_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_alarms';
const STORAGE_KEY_SNOOZED = 'pcc_snoozed_alarms_v1';

const getStoredSnoozedAlarms = (): Alarm[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SNOOZED);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const nowMs = Date.now();
        const valid = parsed.filter((a: any) => typeof a?.expiresAt === 'number' && a.expiresAt > nowMs);
        localStorage.setItem(STORAGE_KEY_SNOOZED, JSON.stringify(valid));
        return valid;
      }
    }
  } catch {
    // Ignore
  }
  return [];
};

const saveSnoozedAlarms = (snoozed: Alarm[]) => {
  try {
    localStorage.setItem(STORAGE_KEY_SNOOZED, JSON.stringify(snoozed));
  } catch (err) {
    console.warn('Failed to save snoozed alarms:', err);
  }
};

const loadStoredAlarms = (): Alarm[] => {
  let baseAlarms: Alarm[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        baseAlarms = parsed.filter((a: any) => !a?.id?.startsWith('alm_snooze'));
      }
    }
  } catch (err) {
    console.warn('Failed to load alarms from V1 storage:', err);
  }

  if (baseAlarms.length === 0) {
    try {
      const legacyRaw = localStorage.getItem(STORAGE_KEY_LEGACY);
      if (legacyRaw !== null) {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy)) {
          baseAlarms = parsedLegacy.filter((a: any) => !a?.id?.startsWith('alm_snooze'));
        }
      }
    } catch (err) {
      console.warn('Failed to load alarms from Legacy storage:', err);
    }
  }

  const activeSnoozed = getStoredSnoozedAlarms();
  return [...baseAlarms, ...activeSnoozed];
};

const saveAlarms = (alarms: Alarm[]) => {
  try {
    const persistentOnly = alarms.filter((a) => !a?.id?.startsWith('alm_snooze'));
    const data = JSON.stringify(persistentOnly);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);

    const snoozedOnly = alarms.filter((a) => a?.id?.startsWith('alm_snooze'));
    saveSnoozedAlarms(snoozedOnly);
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
        const nowMs = Date.now();
        const currentSnoozed = get().alarms.filter(
          (a: any) => a?.id?.startsWith('alm_snooze') && typeof a?.expiresAt === 'number' && a.expiresAt > nowMs
        );
        const merged = [...serverAlarms, ...currentSnoozed];
        set({ alarms: merged, isLoading: false });
        saveAlarms(merged);
        merged.forEach((a) => alarmScheduler.scheduleAlarmNotification(a));
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
    get().alarms.forEach((a) => alarmScheduler.scheduleAlarmNotification(a));
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

    let resultAlarm = newAlarm;
    try {
      const created = await alarmsApi.create(newAlarm);
      if (created && created.id) {
        resultAlarm = created;
      }
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'alarm',
          action: 'create',
          entityId: newAlarm.id,
          payload: newAlarm
        });
      }
    }

    set((state) => {
      const updated = [...state.alarms.filter((a) => a.id !== resultAlarm.id), resultAlarm];
      saveAlarms(updated);
      return { alarms: updated };
    });

    alarmScheduler.scheduleAlarmNotification(resultAlarm);
    return resultAlarm;
  },

  updateAlarm: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await alarmsApi.update(id, updates);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'alarm',
          action: 'update',
          entityId: id,
          payload: updates
        });
      }
    }

    set((state) => {
      const updated = state.alarms.map((a) =>
        a.id === id ? { ...a, ...updates, updatedAt: now } : a
      );
      saveAlarms(updated);
      const target = updated.find((a) => a.id === id);
      if (target) alarmScheduler.scheduleAlarmNotification(target);
      return { alarms: updated };
    });
  },

  editAlarm: async (id, updates) => {
    return get().updateAlarm(id, updates);
  },

  deleteAlarm: async (id) => {
    try {
      await alarmsApi.delete(id);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'alarm',
          action: 'delete',
          entityId: id,
          payload: undefined
        });
      }
    }

    alarmScheduler.cancelAlarmNotification(id);

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
      const target = updated.find((a) => a.id === id);
      if (target) alarmScheduler.scheduleAlarmNotification(target);
      return { alarms: updated };
    });
  },

  snoozeAlarm: async (id, minutes) => {
    const alarm = get().alarms.find((a) => a.id === id);
    if (!alarm) return;

    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeH = now.getHours().toString().padStart(2, '0');
    const snoozeM = now.getMinutes().toString().padStart(2, '0');
    const snoozedTime = `${snoozeH}:${snoozeM}`;

    // Create temporary snoozed alarm instance with 1h expiration grace period
    const snoozedAlarm: Alarm & { expiresAt?: number } = {
      ...alarm,
      id: generateId('alm_snooze'),
      label: `${alarm.label || 'Alarm'} (Snoozed)`,
      time: snoozedTime,
      days: [0, 1, 2, 3, 4, 5, 6],
      enabled: true,
      expiresAt: now.getTime() + 60 * 60 * 1000,
    };

    set((state) => {
      const updated = [...state.alarms, snoozedAlarm];
      saveAlarms(updated);
      return { alarms: updated };
    });

    alarmScheduler.scheduleAlarmNotification(snoozedAlarm);
    soundEffects.playPip();
  },

  duplicateAlarm: async (id) => {
    const original = get().alarms.find((a) => a.id === id);
    if (!original) return undefined;

    return get().addAlarm({
      time: original.time,
      label: `${original.label} (Copy)`,
      enabled: true,
      days: [...(original.days || [])],
      sound: original.sound,
      snoozeMinutes: original.snoozeMinutes,
    });
  },

  previewAlarmSound: (sound: string) => {
    const pattern = sound === 'digital' ? 'digital' : sound === 'gentle' ? 'gentle' : 'radiant';
    soundEffects.playAlarm(pattern);
  },

  getNextAlarmText: () => {
    const enabledAlarms = get().alarms.filter((a) => a.enabled && !a?.id?.startsWith('alm_snooze'));
    if (enabledAlarms.length === 0) return 'No active alarms';

    const now = new Date();
    const currentMin = now.getHours() * 60 + now.getMinutes();
    const currentDay = now.getDay();

    let smallestDelta = Infinity;
    let nextAlarm: Alarm | null = null;

    for (const alarm of enabledAlarms) {
      if (!alarm.time || !/^([01]?\d|2[0-3]):[0-5]\d$/.test(alarm.time)) continue;
      const [h, m] = alarm.time.split(':').map(Number);
      const alarmMin = h * 60 + m;

      const days = alarm.days && alarm.days.length > 0 ? alarm.days : [0, 1, 2, 3, 4, 5, 6];
      for (const d of days) {
        let dayDiff = (d - currentDay + 7) % 7;
        if (dayDiff === 0 && alarmMin <= currentMin) {
          dayDiff = 7;
        }
        const totalDelta = dayDiff * 1440 + (alarmMin - currentMin);
        if (totalDelta < smallestDelta) {
          smallestDelta = totalDelta;
          nextAlarm = alarm;
        }
      }
    }

    if (!nextAlarm) return 'No active alarms';

    const hoursLeft = Math.floor(smallestDelta / 60);
    const minsLeft = smallestDelta % 60;
    if (hoursLeft === 0) {
      return `Next in ${minsLeft}m (${nextAlarm.time})`;
    }
    return `Next in ${hoursLeft}h ${minsLeft}m (${nextAlarm.time})`;
  },
}));
