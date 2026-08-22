import { syncQueue } from '../services/syncQueue';
import { create } from 'zustand';
import { Project } from '../types';
import { projectsApi } from '../services/api';
import { generateId } from '../utils';

interface ProjectStore {
  projects: Project[];
  activeProjectId: string | null;
  filterStatus: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchProjects: () => Promise<void>;
  addProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setActiveProjectId: (id: string | null) => void;
  setFilterStatus: (status: string) => void;
  setSearchQuery: (query: string) => void;
  getProjectById: (id: string) => Project | undefined;
}

const STORAGE_KEY_V1 = 'pcc_projects_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_projects';

const loadStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (p: any) =>
            p.name?.includes('Personal Control Center') ||
            p.name?.includes('Executive Portfolio') ||
            p.name?.includes('Endurance & Longevity')
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
    console.warn('Failed to parse projects from localStorage', err);
  }
  return [];
};

const saveProjects = (projects: Project[]) => {
  try {
    const data = JSON.stringify(projects);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
  } catch (err) {
    console.warn('Failed to save projects to localStorage', err);
  }
};

export const useProjectStore = create<ProjectStore>((set, get) => ({
  projects: loadStoredProjects(),
  activeProjectId: null,
  filterStatus: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverProjects = await projectsApi.getAll();
      if (serverProjects && Array.isArray(serverProjects)) {
        set({ projects: serverProjects, isLoading: false });
        saveProjects(serverProjects);
        return;
      }
    } catch {
      // Fallback to local store
    }
    set({ isLoading: false });
  },

  addProject: async (projectData) => {
    const now = new Date().toISOString();
    const newProject: Project = {
      ...projectData,
      id: generateId('prj'),
      progress: projectData.progress || 0,
      tasksCount: 0,
      completedTasksCount: 0,
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await projectsApi.create(newProject);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.projects];
          saveProjects(updated);
          return { projects: updated };
        });
        return created;
      }
    } catch {
      // Fallback to local
    }

    set((state) => {
      const updated = [newProject, ...state.projects];
      saveProjects(updated);
      return { projects: updated };
    });
    return newProject;
  },

  updateProject: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await projectsApi.update(id, updates);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'project',
          action: 'update',
          entityId: id,
          payload: updates
        });
      }
    }

    set((state) => {
      const updated = state.projects.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: now } : p
      );
      saveProjects(updated);
      return { projects: updated };
    });
  },

  deleteProject: async (id) => {
    try {
      await projectsApi.delete(id);
    } catch (err: any) {
      if (err?.code === 'NETWORK_ERROR' || !navigator.onLine) {
        syncQueue.enqueue({
          entityType: 'project',
          action: 'delete',
          entityId: id,
          payload: undefined
        });
      }
    }

    set((state) => {
      const updated = state.projects.filter((p) => p.id !== id);
      saveProjects(updated);
      return { projects: updated };
    });
  },

  setActiveProjectId: (id) => set({ activeProjectId: id }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getProjectById: (id) => get().projects.find((p) => p.id === id),
}));
