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

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-pcc-01',
    title: 'Personal Control Center (PCC)',
    description: 'Comprehensive personal operating system with AI orchestration, productivity tools, and knowledge graph.',
    status: 'active',
    priority: 'urgent',
    progress: 68,
    dueDate: '2026-09-01',
    startDate: '2026-08-01',
    category: 'Engineering',
    tags: ['React', 'TypeScript', 'FastAPI', 'AI'],
    color: '#6366f1',
    tasksCount: 14,
    completedTasksCount: 9,
    createdAt: '2026-08-01T08:00:00Z',
    updatedAt: '2026-08-15T10:30:00Z',
  },
  {
    id: 'prj-cv-02',
    title: 'Executive Portfolio & Career Revamp',
    description: 'Redesign personal brand, refresh resume and case studies, and prepare executive portfolio presentations.',
    status: 'active',
    priority: 'high',
    progress: 45,
    dueDate: '2026-08-30',
    startDate: '2026-08-10',
    category: 'Career',
    tags: ['Design', 'Brand', 'Portfolio'],
    color: '#8b5cf6',
    tasksCount: 8,
    completedTasksCount: 3,
    createdAt: '2026-08-10T09:00:00Z',
    updatedAt: '2026-08-14T14:20:00Z',
  },
  {
    id: 'prj-ai-03',
    title: 'Autonomous Research & Synthesis Pipeline',
    description: 'Build local LLM-assisted knowledge extractor for arXiv papers, newsletters, and technical podcasts.',
    status: 'planned',
    priority: 'medium',
    progress: 15,
    dueDate: '2026-09-25',
    startDate: '2026-09-01',
    category: 'AI / R&D',
    tags: ['Python', 'LangChain', 'Ollama'],
    color: '#3b82f6',
    tasksCount: 6,
    completedTasksCount: 1,
    createdAt: '2026-08-12T11:00:00Z',
    updatedAt: '2026-08-12T11:00:00Z',
  },
  {
    id: 'prj-fit-04',
    title: 'Endurance & Longevity Protocol Q3',
    description: 'Zone 2 cardio training, progressive overload strength routine, and metabolic health tracking.',
    status: 'active',
    priority: 'medium',
    progress: 82,
    dueDate: '2026-09-30',
    startDate: '2026-07-01',
    category: 'Health & Life',
    tags: ['Fitness', 'Cardio', 'Nutrition'],
    color: '#22c55e',
    tasksCount: 10,
    completedTasksCount: 8,
    createdAt: '2026-07-01T06:00:00Z',
    updatedAt: '2026-08-15T07:15:00Z',
  },
  {
    id: 'prj-arch-05',
    title: 'Home Infrastructure & Smart Home Migration',
    description: 'Setup Home Assistant on local NAS server, configure Zigbee mesh network and automated backups.',
    status: 'completed',
    priority: 'low',
    progress: 100,
    dueDate: '2026-08-10',
    startDate: '2026-07-15',
    category: 'Home & Life',
    tags: ['IoT', 'HomeAssistant', 'Server'],
    color: '#a0a0b8',
    tasksCount: 12,
    completedTasksCount: 12,
    createdAt: '2026-07-15T12:00:00Z',
    updatedAt: '2026-08-10T18:00:00Z',
  },
];

const STORAGE_KEY = 'pcc_projects_store_v1';

const loadStoredProjects = (): Project[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse projects from localStorage', err);
  }
  return INITIAL_PROJECTS;
};

const saveProjects = (projects: Project[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
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
      if (serverProjects && Array.isArray(serverProjects) && serverProjects.length > 0) {
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
    } catch {
      // Ignore API offline error
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
    } catch {
      // Ignore API offline error
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
