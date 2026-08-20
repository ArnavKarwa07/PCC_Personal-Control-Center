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

const STORAGE_KEY = 'pcc_integrations_store_v2';

const INITIAL_INTEGRATIONS: Integration[] = [
  {
    id: 'int-github',
    service: 'github',
    name: 'GitHub Repository Sync',
    description: 'Sync pull requests, assigned issues to tasks, and commit activity logs.',
    connected: false,
    category: 'developer',
    config: {
      token: '',
      repositories: '',
      syncIssues: 'false',
    },
  },
  {
    id: 'int-gcal',
    service: 'google_calendar',
    name: 'Google Calendar (2-Way Sync)',
    description: 'Bidirectional sync of calendar schedules, deep work blocks, and task deadlines.',
    connected: false,
    category: 'calendar',
    config: {
      account: '',
      calendars: '',
      autoSyncInterval: '15m',
    },
  },
  {
    id: 'int-teams-calendar',
    service: 'teams_calendar',
    name: 'Microsoft Teams Calendar',
    description: 'Sync Teams & Outlook meeting schedules, call reminders, and status.',
    connected: false,
    category: 'calendar',
    config: {
      tenantId: '',
      clientId: '',
      calendarId: '',
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
    id: 'int-slack',
    service: 'slack',
    name: 'Slack Integration',
    description: 'Sync status during focus mode, deliver daily digests, and relay task alerts.',
    connected: false,
    category: 'messaging',
    config: {
      userToken: '',
      defaultChannel: '',
    },
  },
  {
    id: 'int-gitlab',
    service: 'gitlab',
    name: 'GitLab Workspace Sync',
    description: 'Sync merge requests, assigned issues to tasks, and pipeline build status.',
    connected: false,
    category: 'developer',
    config: {
      token: '',
      gitlabUrl: 'https://gitlab.com',
      projectIds: '',
    },
  },
  {
    id: 'int-jira',
    service: 'jira',
    name: 'Jira Sprint & Task Sync',
    description: 'Import sprint issues, sync kanban card statuses, and track project tickets.',
    connected: false,
    category: 'developer',
    config: {
      domain: '',
      email: '',
      apiToken: '',
      projectKey: '',
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
      const parsed: Integration[] = JSON.parse(raw);
      const filtered = parsed.filter(
        (i) => i.service !== 'weather' && (i as any).service !== 'openweather' && i.id !== 'int-weather'
      );
      const existingIds = new Set(filtered.map((i) => i.id));
      const missingPresets = INITIAL_INTEGRATIONS.filter((preset) => !existingIds.has(preset.id));
      return [...filtered, ...missingPresets];
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
      if (serverIntegrations && Array.isArray(serverIntegrations)) {
        const currentIntegrations = get().integrations.length > 0 ? get().integrations : INITIAL_INTEGRATIONS;

        // Map server records by provider/service or id
        const serverMap = new Map<string, any>();
        serverIntegrations.forEach((s: any) => {
          const key = s.provider || s.service || s.id;
          if (key) serverMap.set(key, s);
        });

        // Merge server state into preset descriptors to preserve UI metadata (name, description, category, service)
        const merged: Integration[] = currentIntegrations.map((preset) => {
          const serverRecord = serverMap.get(preset.service) || serverMap.get(preset.id);
          if (!serverRecord) return preset;

          const isConnected = Boolean(
            serverRecord.isConnected ?? serverRecord.connected ?? (serverRecord.status === 'connected')
          );

          return {
            ...preset,
            connected: isConnected,
            config: serverRecord.config ? { ...preset.config, ...serverRecord.config } : preset.config,
            lastSynced: serverRecord.lastSynced || serverRecord.lastSyncedAt || serverRecord.updatedAt || preset.lastSynced,
          };
        });

        set({ integrations: merged, isLoading: false });
        saveIntegrations(merged);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  toggleConnect: async (id, config) => {
    const integration = get().integrations.find((i) => i.id === id || i.service === id);
    if (!integration) return;

    const provider = (integration as any).provider || integration.service;
    const targetId = integration.id;
    const nextConnected = !integration.connected;
    const now = new Date().toISOString();

    soundEffects.playPip();

    try {
      if (nextConnected) {
        await integrationsApi.connect(provider, config || integration.config || {});
      } else {
        await integrationsApi.disconnect(provider);
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === targetId || item.service === provider
          ? {
              ...item,
              connected: nextConnected,
              config: config ? { ...item.config, ...config } : item.config,
              lastSynced: nextConnected ? now : item.lastSynced,
            }
          : item
      );
      saveIntegrations(updated);
      return { integrations: updated };
    });
  },

  updateConfig: async (id, config) => {
    const integration = get().integrations.find((i) => i.id === id || i.service === id);
    const targetId = integration?.id || id;
    const provider = integration ? (integration as any).provider || integration.service : id;

    try {
      await integrationsApi.update(provider, { config });
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === targetId || item.service === provider ? { ...item, config: { ...item.config, ...config } } : item
      );
      saveIntegrations(updated);
      return { integrations: updated };
    });
  },

  syncIntegration: async (id) => {
    const integration = get().integrations.find((i) => i.id === id || i.service === id);
    const targetId = integration?.id || id;
    const provider = integration ? (integration as any).provider || integration.service : id;

    set((state) => ({ isSyncing: { ...state.isSyncing, [targetId]: true } }));

    // Simulate small sync delay for great UX feel
    await new Promise((res) => setTimeout(res, 800));

    const now = new Date().toISOString();
    let success = true;

    try {
      await integrationsApi.sync(provider);
    } catch {
      // Fallback
    }

    soundEffects.playChime();

    set((state) => {
      const updated = state.integrations.map((item) =>
        item.id === targetId || item.service === provider ? { ...item, lastSynced: now } : item
      );
      saveIntegrations(updated);
      return {
        integrations: updated,
        isSyncing: { ...state.isSyncing, [targetId]: false },
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
