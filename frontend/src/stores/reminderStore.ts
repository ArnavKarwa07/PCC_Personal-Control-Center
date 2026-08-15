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

const STORAGE_KEY = 'pcc_reminders_store_v1';

const INITIAL_REMINDERS: Reminder[] = [
  {
    id: 'rem-01',
    title: 'Review Sprint Velocity & Phase C Release Milestones',
    notes: 'Verify TypeScript compilation, check test suites, and review documentation.',
    dueDate: '2026-08-15',
    dueTime: '15:30',
    priority: 'high',
    completed: false,
    recurrence: 'none',
    category: 'Work',
    tags: ['Sprint', 'PhaseC'],
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'rem-02',
    title: 'Hydration & Posture Reset',
    notes: 'Drink 500ml water and do 2 minutes spinal decompression stretch.',
    dueDate: '2026-08-15',
    dueTime: '16:00',
    priority: 'medium',
    completed: false,
    recurrence: 'daily',
    category: 'Health',
    tags: ['Habit', 'Health'],
    createdAt: '2026-08-15T08:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'rem-03',
    title: 'Submit Bi-weekly Cloud Infrastructure Invoices',
    notes: 'Check AWS and Neon billing dashboard for usage anomalies.',
    dueDate: '2026-08-16',
    dueTime: '10:00',
    priority: 'urgent',
    completed: false,
    recurrence: 'monthly',
    category: 'Finance',
    tags: ['Bills', 'DevOps'],
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-14T10:00:00Z',
  },
  {
    id: 'rem-04',
    title: 'Weekly Systems Retrospective Reflection',
    notes: 'Review weekly logs, score goal completion, recalibrate focus priorities.',
    dueDate: '2026-08-16',
    dueTime: '18:00',
    priority: 'medium',
    completed: false,
    recurrence: 'weekly',
    category: 'Personal',
    tags: ['Review', 'Routine'],
    createdAt: '2026-08-14T12:00:00Z',
    updatedAt: '2026-08-14T12:00:00Z',
  },
  {
    id: 'rem-05',
    title: 'Morning Focus Block Standup',
    notes: 'Pick top 3 high-impact deliverables for the morning.',
    dueDate: '2026-08-15',
    dueTime: '08:30',
    priority: 'urgent',
    completed: true,
    recurrence: 'daily',
    category: 'Work',
    tags: ['Focus', 'Morning'],
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-08-15T08:35:00Z',
  },
];

const loadStoredReminders = (): Reminder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load reminders from localStorage', err);
  }
  return INITIAL_REMINDERS;
};

const saveReminders = (reminders: Reminder[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders));
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
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
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
    } catch {
      // Fallback
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
    } catch {
      // Fallback
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
      await remindersApi.snooze(id, snoozeDate);
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
