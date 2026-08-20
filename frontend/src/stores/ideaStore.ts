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

const STORAGE_KEY_V1 = 'pcc_ideas_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_ideas';

const loadStoredIdeas = (): Idea[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (i: any) =>
            i.title?.includes('AI-Powered Personal Knowledge') ||
            i.title?.includes('Automated Morning Routine') ||
            i.title?.includes('Smart Home Telemetry Integration')
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
    console.warn('Failed to parse ideas from localStorage', err);
  }
  return [];
};

const saveIdeas = (ideas: Idea[]) => {
  try {
    const data = JSON.stringify(ideas);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
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
      if (serverIdeas && Array.isArray(serverIdeas)) {
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
