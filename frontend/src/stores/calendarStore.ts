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

// Generate events relative to current date (Aug 2026)
const INITIAL_EVENTS: CalendarEvent[] = [
  {
    id: 'evt-01',
    title: 'Deep Work: Core Engineering & Phase B Views',
    description: 'Focused coding block for Kanban, Notes, Calendar and Task views.',
    type: 'event',
    startDate: '2026-08-15T09:00:00',
    endDate: '2026-08-15T11:30:00',
    allDay: false,
    priority: 'urgent',
    color: '#6366f1',
    location: 'Office / Terminal',
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'evt-02',
    title: 'Architecture & UI Component Design Review',
    description: 'Review responsive layouts and accessibility compliance with team.',
    type: 'event',
    startDate: '2026-08-15T14:00:00',
    endDate: '2026-08-15T15:00:00',
    allDay: false,
    priority: 'high',
    color: '#3b82f6',
    location: 'Google Meet',
    createdAt: '2026-08-12T10:00:00Z',
    updatedAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'evt-03',
    title: 'Deadline: Dark-Themed Kanban Board',
    description: 'Milestone target for drag & drop kanban with 4 status columns.',
    type: 'task',
    startDate: '2026-08-16T18:00:00',
    allDay: true,
    priority: 'urgent',
    color: '#22c55e',
    relatedId: 'tsk-01',
    completed: false,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'evt-04',
    title: 'Hydration & Posture Reset Reminder',
    description: 'Stretch, hydrate with electrolytes, and step away from the screen.',
    type: 'reminder',
    startDate: '2026-08-15T16:30:00',
    allDay: false,
    priority: 'low',
    color: '#f59e0b',
    completed: false,
    createdAt: '2026-08-15T06:00:00Z',
    updatedAt: '2026-08-15T06:00:00Z',
  },
  {
    id: 'evt-05',
    title: 'Deadline: Split-Pane Markdown Knowledge Workspace',
    description: 'Note auto-save and category filtering deliverable.',
    type: 'task',
    startDate: '2026-08-17T17:00:00',
    allDay: true,
    priority: 'high',
    color: '#22c55e',
    relatedId: 'tsk-02',
    completed: false,
    createdAt: '2026-08-14T08:00:00Z',
    updatedAt: '2026-08-14T08:00:00Z',
  },
  {
    id: 'evt-06',
    title: 'Executive Portfolio Strategy Session',
    description: 'Review case study narratives and target engineering leadership roles.',
    type: 'event',
    startDate: '2026-08-18T10:30:00',
    endDate: '2026-08-18T11:45:00',
    allDay: false,
    priority: 'medium',
    color: '#8b5cf6',
    location: 'Virtual Conference',
    createdAt: '2026-08-13T12:00:00Z',
    updatedAt: '2026-08-13T12:00:00Z',
  },
  {
    id: 'evt-07',
    title: 'Monthly Cloud Infrastructure & Security Audit',
    description: 'Verify IAM permissions, API keys rotation, and automated database backups.',
    type: 'reminder',
    startDate: '2026-08-20T09:00:00',
    allDay: false,
    priority: 'high',
    color: '#f59e0b',
    completed: false,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'evt-08',
    title: 'Weekly Systems Retrospective',
    description: 'Weekly reflection on progress, blockers, and habit consistency.',
    type: 'event',
    startDate: '2026-08-16T17:00:00',
    endDate: '2026-08-16T18:00:00',
    allDay: false,
    priority: 'medium',
    color: '#6366f1',
    createdAt: '2026-08-10T12:00:00Z',
    updatedAt: '2026-08-10T12:00:00Z',
  },
];

const STORAGE_KEY = 'pcc_calendar_store_v1';

const loadStoredEvents = (): CalendarEvent[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse calendar events from localStorage', err);
  }
  return INITIAL_EVENTS;
};

const saveEvents = (events: CalendarEvent[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  } catch (err) {
    console.warn('Failed to save calendar events to localStorage', err);
  }
};

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: loadStoredEvents(),
  currentDate: '2026-08-15',
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
      if (serverEvents && Array.isArray(serverEvents) && serverEvents.length > 0) {
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
