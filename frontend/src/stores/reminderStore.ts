import { syncQueue } from '../services/syncQueue';
import { create } from 'zustand';
import type { Reminder } from '../types';
import { remindersApi } from '../services/api';
import { generateId } from '../utils';
import { soundEffects } from '../utils/audio';

export type ReminderFilterStatus = 'all' | 'today' | 'upcoming' | 'snoozed' | 'completed';

interface ReminderStore {
  reminders: Reminder[];
  activeReminderId: string | null;
  filterStatus: ReminderFilterStatus;
  filterCategory: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchReminders: () => Promise<void>;
  addReminder: (reminder: Omit<Reminder, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Reminder>;
  updateReminder: (id: string, updates: Partial<Reminder>) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  toggleComplete: (id: string) => Promise<void>;
  snoozeReminder: (id: string, minutes: number) => Promise<void>;
  setActiveReminderId: (id: string | null) => void;
  setFilterStatus: (status: ReminderFilterStatus) => void;
  setFilterCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  getReminderById: (id: string) => Reminder | undefined;
}

const STORAGE_KEY_V1 = 'pcc_reminders_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_reminders';

const loadStoredReminders = (): Reminder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (r: any) =>
            r.title?.includes('Review Sprint Velocity') ||
            r.title?.includes('Hydration & Posture Reset') ||
            r.title?.includes('Submit Bi-weekly Cloud') ||
            r.title?.includes('Weekly Systems Retrospective')
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
    console.warn('Failed to load reminders from localStorage', err);
  }
  return [];
};

const saveReminders = (reminders: Reminder[]) => {
  try {
    const data = JSON.stringify(reminders);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
  } catch (err) {
    console.warn('Failed to save reminders to localStorage', err);
  }
};

export const useReminderStore = create<ReminderStore>((set, get) => ({
  reminders: loadStoredReminders(),
  activeReminderId: null,
  filterStatus: 'all',
  filterCategory: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchReminders: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverData = await remindersApi.getAll();
      if (serverData && Array.isArray(serverData)) {
        set({ reminders: serverData, isLoading: false });
        saveReminders(serverData);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addReminder: async (data) => {
    const now = new Date().toISOString();
    const newReminder: Reminder = {
      ...data,
      id: generateId('rem'),
      priority: data.priority || 'medium',
      completed: false,
      recurrence: data.recurrence || 'none',
      tags: data.tags || [],
      category: data.category || 'General',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await remindersApi.create(newReminder);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.reminders];
          saveReminders(updated);
          return { reminders: updated };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [newReminder, ...state.reminders];
      saveReminders(updated);
      return { reminders: updated };
    });
    return newReminder;
  },

  updateReminder: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await remindersApi.update(id, updates);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'reminder',
          action: 'update',
          entityId: id,
          payload: updates
        });
      }
    }

    set((state) => {
      const updated = state.reminders.map((r) =>
        r.id === id ? { ...r, ...updates, updatedAt: now } : r
      );
      saveReminders(updated);
      return { reminders: updated };
    });
  },

  deleteReminder: async (id) => {
    try {
      await remindersApi.delete(id);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'reminder',
          action: 'delete',
          entityId: id,
          payload: undefined
        });
      }
    }

    set((state) => {
      const updated = state.reminders.filter((r) => r.id !== id);
      saveReminders(updated);
      return { reminders: updated };
    });
  },

  toggleComplete: async (id) => {
    const reminder = get().reminders.find((r) => r.id === id);
    if (!reminder) return;

    const nextCompleted = !reminder.completed;
    if (nextCompleted) {
      soundEffects.playPip();
    }

    await get().updateReminder(id, {
      completed: nextCompleted,
      snoozedUntil: undefined,
    });
  },

  snoozeReminder: async (id, minutes) => {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    try {
      await remindersApi.snooze(id, snoozeDate, minutes);
    } catch {
      // Fallback
    }

    soundEffects.playPip();

    set((state) => {
      const updated = state.reminders.map((r) =>
        r.id === id ? { ...r, snoozedUntil: snoozeDate, completed: false, updatedAt: new Date().toISOString() } : r
      );
      saveReminders(updated);
      return { reminders: updated };
    });
  },

  setActiveReminderId: (id) => set({ activeReminderId: id }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterCategory: (filterCategory) => set({ filterCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getReminderById: (id) => get().reminders.find((r) => r.id === id),
}));
