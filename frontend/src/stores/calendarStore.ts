import { create } from 'zustand';
import { CalendarEvent } from '../types';
import { calendarApi } from '../services/api';
import { generateId } from '../utils';

interface CalendarFilterTypes {
  events: boolean;
  tasks: boolean;
  reminders: boolean;
}

interface CalendarStore {
  events: CalendarEvent[];
  currentDate: string; // ISO date string e.g. '2026-08-15'
  activeView: 'month' | 'week' | 'day' | 'agenda';
  filterTypes: CalendarFilterTypes;
  selectedEventId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchEvents: () => Promise<void>;
  addEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<CalendarEvent>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  toggleEventCompleted: (id: string) => Promise<void>;
  setCurrentDate: (dateStr: string) => void;
  setActiveView: (view: 'month' | 'week' | 'day' | 'agenda') => void;
  toggleFilterType: (type: keyof CalendarFilterTypes) => void;
  setSelectedEventId: (id: string | null) => void;
  getEventById: (id: string) => CalendarEvent | undefined;
}

const STORAGE_KEY_V1 = 'pcc_calendar_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_calendar_events';

const loadStoredEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (e: any) =>
            e.title?.includes('Phase E Release Standup') ||
            e.title?.includes('OpenAPI Endpoint Specs') ||
            e.title?.includes('Weekly Architecture Review')
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
    console.warn('Failed to parse calendar events from localStorage', err);
  }
  return [];
};

const saveEvents = (events: CalendarEvent[]) => {
  try {
    const data = JSON.stringify(events);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
  } catch (err) {
    console.warn('Failed to save calendar events to localStorage', err);
  }
};

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: loadStoredEvents(),
  currentDate: new Date().toLocaleDateString('en-CA'),
  activeView: 'month',
  filterTypes: {
    events: true,
    tasks: true,
    reminders: true,
  },
  selectedEventId: null,
  isLoading: false,
  error: null,

  fetchEvents: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverEvents = await calendarApi.getAll();
      if (serverEvents && Array.isArray(serverEvents)) {
        set({ events: serverEvents, isLoading: false });
        saveEvents(serverEvents);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addEvent: async (eventData) => {
    const now = new Date().toISOString();
    const newEvent: CalendarEvent = {
      ...eventData,
      id: generateId('evt'),
      color:
        eventData.color ||
        (eventData.type === 'event'
          ? '#6366f1'
          : eventData.type === 'task'
          ? '#22c55e'
          : '#f59e0b'),
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await calendarApi.create(newEvent);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.events];
          saveEvents(updated);
          return { events: updated };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [newEvent, ...state.events];
      saveEvents(updated);
      return { events: updated };
    });
    return newEvent;
  },

  updateEvent: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await calendarApi.update(id, updates);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.events.map((e) =>
        e.id === id ? { ...e, ...updates, updatedAt: now } : e
      );
      saveEvents(updated);
      return { events: updated };
    });
  },

  deleteEvent: async (id) => {
    try {
      await calendarApi.delete(id);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.events.filter((e) => e.id !== id);
      saveEvents(updated);
      return { events: updated, selectedEventId: null };
    });
  },

  toggleEventCompleted: async (id) => {
    const evt = get().events.find((e) => e.id === id);
    if (!evt) return;
    await get().updateEvent(id, { completed: !evt.completed });
  },

  setCurrentDate: (currentDate) => set({ currentDate }),
  setActiveView: (activeView) => set({ activeView }),
  toggleFilterType: (type) =>
    set((state) => ({
      filterTypes: {
        ...state.filterTypes,
        [type]: !state.filterTypes[type],
      },
    })),
  setSelectedEventId: (selectedEventId) => set({ selectedEventId }),
  getEventById: (id) => get().events.find((e) => e.id === id),
}));
