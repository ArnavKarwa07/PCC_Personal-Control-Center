import { create } from 'zustand';
import type { AppNotification } from '../types';
import { notificationsApi } from '../services/api';
import { generateId } from '../utils';
import { soundEffects } from '../utils/audio';

export type NotificationFilter = 'all' | 'unread' | 'task' | 'reminder' | 'alarm' | 'system' | 'calendar' | 'integration';

interface NotificationStore {
  notifications: AppNotification[];
  filter: NotificationFilter;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  setFilter: (filter: NotificationFilter) => void;
  getUnreadCount: () => number;
}

const STORAGE_KEY = 'pcc_notifications_store_v1';

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-01',
    title: 'Reminder: Review Sprint Velocity',
    message: 'Scheduled reminder for 15:30 today in Work category.',
    read: false,
    type: 'reminder',
    priority: 'warning',
    link: '/reminders',
    createdAt: '2026-08-15T15:00:00Z',
  },
  {
    id: 'notif-02',
    title: 'Task Completed: Implement Kanban Board',
    message: 'High priority task was marked completed in Personal Control Center project.',
    read: false,
    type: 'task',
    priority: 'success',
    link: '/tasks',
    createdAt: '2026-08-15T12:00:00Z',
  },
  {
    id: 'notif-03',
    title: 'Calendar Sync: Weekly Team Architecture Review',
    message: 'Event starts in 1 hour on Google Calendar sync channel.',
    read: false,
    type: 'calendar',
    priority: 'info',
    link: '/calendar',
    createdAt: '2026-08-15T10:00:00Z',
  },
  {
    id: 'notif-04',
    title: 'GitHub Integration Synced',
    message: 'Successfully pulled 14 recent repository commits and 2 open pull requests.',
    read: true,
    type: 'integration',
    priority: 'info',
    link: '/settings',
    createdAt: '2026-08-15T08:30:00Z',
  },
  {
    id: 'notif-05',
    title: 'Sunrise Alarm Triggered',
    message: 'Wakeup alarm at 06:30 completed successfully.',
    read: true,
    type: 'alarm',
    priority: 'info',
    link: '/alarms',
    createdAt: '2026-08-15T06:30:00Z',
  },
];

const loadStoredNotifications = (): AppNotification[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load notifications from localStorage', err);
  }
  return INITIAL_NOTIFICATIONS;
};

const saveNotifications = (notifications: AppNotification[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch (err) {
    console.warn('Failed to save notifications to localStorage', err);
  }
};

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  notifications: loadStoredNotifications(),
  filter: 'all',
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverNotifs = await notificationsApi.getAll();
      if (serverNotifs && Array.isArray(serverNotifs) && serverNotifs.length > 0) {
        set({ notifications: serverNotifs, isLoading: false });
        saveNotifications(serverNotifs);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return { notifications: updated };
    });
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch {
      // Fallback
    }

    soundEffects.playPip();

    set((state) => {
      const updated = state.notifications.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return { notifications: updated };
    });
  },

  deleteNotification: async (id) => {
    try {
      await notificationsApi.delete(id);
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.notifications.filter((n) => n.id !== id);
      saveNotifications(updated);
      return { notifications: updated };
    });
  },

  clearAll: async () => {
    try {
      await notificationsApi.clearAll();
    } catch {
      // Fallback
    }

    soundEffects.playPip();

    set({ notifications: [] });
    saveNotifications([]);
  },

  addNotification: (notifData) => {
    const newNotif: AppNotification = {
      ...notifData,
      id: generateId('notif'),
      read: false,
      createdAt: new Date().toISOString(),
    };

    soundEffects.playChime();

    set((state) => {
      const updated = [newNotif, ...state.notifications];
      saveNotifications(updated);
      return { notifications: updated };
    });
  },

  setFilter: (filter) => set({ filter }),

  getUnreadCount: () => {
    return get().notifications.filter((n) => !n.read).length;
  },
}));
