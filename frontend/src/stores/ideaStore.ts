import { create } from 'zustand';
import { Idea, IdeaStatus } from '../types';
import { ideasApi } from '../services/api';
import { generateId } from '../utils';

interface IdeaStore {
  ideas: Idea[];
  searchQuery: string;
  selectedCategory: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchIdeas: () => Promise<void>;
  addIdea: (idea: Omit<Idea, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Idea>;
  updateIdea: (id: string, updates: Partial<Idea>) => Promise<void>;
  deleteIdea: (id: string) => Promise<void>;
  moveIdeaStatus: (id: string, status: IdeaStatus) => Promise<void>;
  promoteIdea: (id: string, promotion: { type: 'task' | 'project'; id: string; title: string }) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setSelectedCategory: (cat: string) => void;
}

const INITIAL_IDEAS: Idea[] = [
  {
    id: 'idea-01',
    title: 'Voice-Controlled Offline Note Dictation with Whisper',
    description: 'Integrate browser Web Audio API with local quantized Whisper model for friction-free voice capture in PCC.',
    status: 'captured',
    category: 'AI / Voice',
    tags: ['AI', 'Audio', 'Whisper'],
    impact: 'high',
    effort: 'medium',
    createdAt: '2026-08-14T11:00:00Z',
    updatedAt: '2026-08-14T11:00:00Z',
  },
  {
    id: 'idea-02',
    title: 'Automated Smart Workout & HRV Recovery Predictor',
    description: 'Sync health metrics from wearable API, compute training readiness score, and adjust daily target volume.',
    status: 'captured',
    category: 'Health',
    tags: ['Health', 'Wearables'],
    impact: 'medium',
    effort: 'low',
    createdAt: '2026-08-13T09:30:00Z',
    updatedAt: '2026-08-13T09:30:00Z',
  },
  {
    id: 'idea-03',
    title: 'Autonomous Newsletter & RSS Synthesizer',
    description: 'Fetch daily Substack and ArXiv RSS feeds, cluster topics, and generate 5-bullet executive digests into Notes.',
    status: 'exploring',
    category: 'Automation',
    tags: ['RSS', 'LLM', 'Productivity'],
    impact: 'high',
    effort: 'medium',
    createdAt: '2026-08-10T14:00:00Z',
    updatedAt: '2026-08-15T09:00:00Z',
  },
  {
    id: 'idea-04',
    title: 'Bi-Directional Knowledge Graph Visualization',
    description: 'Interactive Force-directed 3D node graph showing links between Projects, Notes, Tasks, and Career milestones.',
    status: 'exploring',
    category: 'Engineering',
    tags: ['Graph', 'ThreeJS', 'Knowledge'],
    impact: 'high',
    effort: 'high',
    createdAt: '2026-08-08T16:00:00Z',
    updatedAt: '2026-08-12T10:00:00Z',
  },
  {
    id: 'idea-05',
    title: 'Personal Control Center (PCC) Web Operating Dashboard',
    description: 'Unified command center for high performers with zero latency, dark aesthetic, and full task/calendar sync.',
    status: 'promoted',
    category: 'Engineering',
    tags: ['PCC', 'Core', 'Vite'],
    impact: 'high',
    effort: 'high',
    promotedTo: {
      type: 'project',
      id: 'prj-pcc-01',
      title: 'Personal Control Center (PCC)',
    },
    createdAt: '2026-07-28T10:00:00Z',
    updatedAt: '2026-08-01T08:00:00Z',
  },
  {
    id: 'idea-06',
    title: 'Custom Ortholinear Mechanical Keyboard Firmware',
    description: 'Write custom QMK/ZMK firmware with dynamic layers for window navigation and vim bindings.',
    status: 'archived',
    category: 'Hardware',
    tags: ['QMK', 'Hardware'],
    impact: 'low',
    effort: 'medium',
    createdAt: '2026-07-15T18:00:00Z',
    updatedAt: '2026-08-05T12:00:00Z',
  },
];

const STORAGE_KEY = 'pcc_ideas_store_v1';

const loadStoredIdeas = (): Idea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse ideas from localStorage', err);
  }
  return INITIAL_IDEAS;
};

const saveIdeas = (ideas: Idea[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch (err) {
    console.warn('Failed to save ideas to localStorage', err);
  }
};

export const useIdeaStore = create<IdeaStore>((set, get) => ({
  ideas: loadStoredIdeas(),
  searchQuery: '',
  selectedCategory: 'All',
  isLoading: false,
  error: null,

  fetchIdeas: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverIdeas = await ideasApi.getAll();
      if (serverIdeas && Array.isArray(serverIdeas) && serverIdeas.length > 0) {
        set({ ideas: serverIdeas, isLoading: false });
        saveIdeas(serverIdeas);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addIdea: async (ideaData) => {
    const now = new Date().toISOString();
    const newIdea: Idea = {
      ...ideaData,
      id: generateId('idea'),
      tags: ideaData.tags || [],
      impact: ideaData.impact || 'medium',
      effort: ideaData.effort || 'medium',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await ideasApi.create(newIdea);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.ideas];
          saveIdeas(updated);
          return { ideas: updated };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [newIdea, ...state.ideas];
      saveIdeas(updated);
      return { ideas: updated };
    });
    return newIdea;
  },

  updateIdea: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await ideasApi.update(id, updates);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.ideas.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: now } : i
      );
      saveIdeas(updated);
      return { ideas: updated };
    });
  },

  deleteIdea: async (id) => {
    try {
      await ideasApi.delete(id);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.ideas.filter((i) => i.id !== id);
      saveIdeas(updated);
      return { ideas: updated };
    });
  },

  moveIdeaStatus: async (id, status) => {
    await get().updateIdea(id, { status });
  },

  promoteIdea: async (id, promotion) => {
    const now = new Date().toISOString();
    try {
      await ideasApi.promote(id, {
        type: promotion.type,
        title: promotion.title,
        projectId: promotion.type === 'task' ? promotion.id : undefined,
      });
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.ideas.map((i) =>
        i.id === id
          ? {
              ...i,
              status: 'promoted' as IdeaStatus,
              promotedTo: promotion,
              updatedAt: now,
            }
          : i
      );
      saveIdeas(updated);
      return { ideas: updated };
    });
  },

  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
}));
