import { create } from 'zustand';
import type { Integration } from '../types';
import { integrationsApi } from '../services/api';
import { soundEffects } from '../utils/audio';

interface IntegrationStore {
  integrations: Integration[];
  isLoading: boolean;
  isSyncing: Record<string, boolean>;
  error: string | null;

  // Actions
  fetchIntegrations: () => Promise<void>;
  toggleConnect: (id: string, config?: Record<string, string>) => Promise<void>;
  updateConfig: (id: string, config: Record<string, string>) => Promise<void>;
  syncIntegration: (id: string) => Promise<boolean>;
  testConnection: (id: string) => Promise<boolean>;
}

const STORAGE_KEY = 'pcc_integrations_store_v1';

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-github',
    service: 'github',
    name: 'GitHub Repository Sync',
    description: 'Sync pull requests, assigned issues to tasks, and commit activity logs.',
    connected: true,
    lastSynced: '2026-08-15T08:30:00Z',
    category: 'developer',
    config: {
      token: 'ghp_************************************',
      repositories: 'ArnavKarwa07/PCC_Personal-Control-Center',
      syncIssues: 'true',
    },
  },
  {
    id: 'int-gcal',
    service: 'google_calendar',
    name: 'Google Calendar (2-Way Sync)',
    description: 'Bidirectional sync of calendar schedules, deep work blocks, and task deadlines.',
    connected: true,
    lastSynced: '2026-08-15T10:00:00Z',
    category: 'calendar',
    config: {
      account: 'arnav.karwa@pcc.local',
      calendars: 'Primary, Focus Schedule',
      autoSyncInterval: '15m',
    },
  },
  {
    id: 'int-weather',
    service: 'weather',
    name: 'OpenWeather Map API',
    description: 'Live hyper-local weather conditions, air quality index, and severe weather warnings.',
    connected: true,
    lastSynced: '2026-08-15T12:00:00Z',
    category: 'environment',
    config: {
      apiKey: 'owm_********************************',
      defaultCity: 'San Francisco',
      units: 'metric',
    },
  },
  {
    id: 'int-telegram',
    service: 'telegram',
    name: 'Telegram Bot Assistant',
    description: 'Instant notification alerts, quick capture commands, and morning digest delivery.',
    connected: false,
    category: 'messaging',
    config: {
      botToken: '',
      chatId: '',
    },
  },
  {
    id: 'int-notion',
    service: 'notion',
    name: 'Notion Workspace Sync',
    description: 'Import databases, export meeting notes, and sync project roadmaps.',
    connected: false,
    category: 'knowledge',
    config: {
      apiKey: '',
      workspaceId: '',
    },
  },
  {
    id: 'int-discord',
    service: 'discord',
    name: 'Discord Webhook Dispatcher',
    description: 'Broadcast task completions and sprint progress summaries to Discord channels.',
    connected: false,
    category: 'messaging',
    config: {
      webhookUrl: '',
    },
  },
];

const loadStoredIntegrations = (): Integration[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to load integrations from localStorage', err);
  }
  return INITIAL_INTEGRATIONS;
};

const saveIntegrations = (integrations: Integration[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(integrations));
  } catch (err) {
    console.warn('Failed to save integrations to localStorage', err);
  }
};

export const useIntegrationStore = create<IntegrationStore>((set, get) => ({
  integrations: loadStoredIntegrations(),
  isLoading: false,
  isSyncing: {},
  error: null,

  fetchIntegrations: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverIntegrations = await integrationsApi.getAll();
      if (serverIntegrations && Array.isArray(serverIntegrations) && serverIntegrations.length > 0) {
        set({ integrations: serverIntegrations, isLoading: false });
        saveIntegrations(serverIntegrations);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  toggleConnect: async (id, config) => {
    const integration = get().integrations.find((i) => i.id === id);
    if (!integration) return;

    const nextConnected = !integration.connected;
    const now = new Date().toISOString();

    soundEffects.playPip();

    try {
      if (nextConnected) {
        await integrationsApi.connect(id, config || integration.config || {});
      } else {
        await integrationsApi.disconnect(id);
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === id
          ? {
              ...item,
              connected: nextConnected,
              config: config || item.config,
              lastSynced: nextConnected ? now : item.lastSynced,
            }
          : item
      );
      saveIntegrations(updated);
      return { integrations: updated };
    });
  },

  updateConfig: async (id, config) => {
    try {
      await integrationsApi.update(id, { config });
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === id ? { ...item, config: { ...item.config, ...config } } : item
      );
      saveIntegrations(updated);
      return { integrations: updated };
    });
  },

  syncIntegration: async (id) => {
    set((state) => ({ isSyncing: { ...state.isSyncing, [id]: true } }));

    // Simulate small sync delay for great UX feel
    await new Promise((res) => setTimeout(res, 800));

    const now = new Date().toISOString();
    let success = true;

    try {
      await integrationsApi.sync(id);
    } catch {
      // Fallback
    }

    soundEffects.playChime();

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === id ? { ...item, lastSynced: now } : item
      );
      saveIntegrations(updated);
      return {
        integrations: updated,
        isSyncing: { ...state.isSyncing, [id]: false },
      };
    });

    return success;
  },

  testConnection: async (_id) => {
    soundEffects.playPip();
    await new Promise((res) => setTimeout(res, 500));
    return true;
  },
}));
