import { create } from 'zustand';
import { Task, KanbanColumnId, TaskStatus, SubTask } from '../types';
import { tasksApi } from '../services/api';
import { generateId } from '../utils';

interface TaskStore {
  tasks: Task[];
  activeTaskId: string | null;
  viewMode: 'list' | 'kanban' | 'project' | 'priority';
  filterStatus: string;
  filterPriority: string;
  filterDueDate: string;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTaskComplete: (id: string) => Promise<void>;
  moveTaskColumn: (id: string, columnId: KanbanColumnId) => Promise<void>;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  deleteSubtask: (taskId: string, subtaskId: string) => void;
  setActiveTaskId: (id: string | null) => void;
  setViewMode: (mode: 'list' | 'kanban' | 'project' | 'priority') => void;
  setFilterStatus: (status: string) => void;
  setFilterPriority: (priority: string) => void;
  setFilterDueDate: (dueDate: string) => void;
  setSearchQuery: (query: string) => void;
  getTaskById: (id: string) => Task | undefined;
}

const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-01',
    title: 'Implement Dark-Themed Kanban Board with Drag & Drop',
    description: 'Build responsive 4-column kanban board with custom CSS design tokens and micro-interactions.',
    status: 'in_progress',
    columnId: 'in_progress',
    priority: 'urgent',
    projectId: 'prj-pcc-01',
    projectName: 'Personal Control Center (PCC)',
    dueDate: '2026-08-16',
    recurrence: 'none',
    subtasks: [
      { id: 'sub-01', title: 'Design column header layout & count badges', completed: true },
      { id: 'sub-02', title: 'Implement card dragging and drop targets', completed: true },
      { id: 'sub-03', title: 'Add quick-move action buttons', completed: false },
      { id: 'sub-04', title: 'Add inline card creation form', completed: false },
    ],
    tags: ['UI', 'Kanban', 'Frontend'],
    createdAt: '2026-08-14T09:00:00Z',
    updatedAt: '2026-08-15T12:00:00Z',
  },
  {
    id: 'tsk-02',
    title: 'Build Split-Pane Markdown Knowledge Workspace',
    description: 'Implement markdown editor with auto-save debounce, pinned note section, and category filtering.',
    status: 'in_progress',
    columnId: 'in_progress',
    priority: 'high',
    projectId: 'prj-pcc-01',
    projectName: 'Personal Control Center (PCC)',
    dueDate: '2026-08-17',
    recurrence: 'none',
    subtasks: [
      { id: 'sub-05', title: 'Create note list with search and tags', completed: true },
      { id: 'sub-06', title: 'Build live markdown preview mode', completed: true },
      { id: 'sub-07', title: 'Add autosave visual feedback indicator', completed: false },
    ],
    tags: ['Notes', 'Markdown'],
    createdAt: '2026-08-14T10:00:00Z',
    updatedAt: '2026-08-15T11:00:00Z',
  },
  {
    id: 'tsk-03',
    title: 'Setup Unified Calendar Grid with Month & Week Views',
    description: 'Provide interactive calendar scheduler with event modals, task deadline markers, and type filters.',
    status: 'todo',
    columnId: 'todo',
    priority: 'high',
    projectId: 'prj-pcc-01',
    projectName: 'Personal Control Center (PCC)',
    dueDate: '2026-08-18',
    recurrence: 'none',
    subtasks: [
      { id: 'sub-08', title: 'Build month grid computation & current day highlight', completed: false },
      { id: 'sub-09', title: 'Add week time-slot view', completed: false },
      { id: 'sub-10', title: 'Connect event click popover and add event dialog', completed: false },
    ],
    tags: ['Calendar', 'Schedule'],
    createdAt: '2026-08-14T11:30:00Z',
    updatedAt: '2026-08-14T11:30:00Z',
  },
  {
    id: 'tsk-04',
    title: 'Daily Morning Deep Work Review & Standup',
    description: 'Review highest leverage goals, calibrate top 3 priorities, and clear urgent blockers.',
    status: 'completed',
    columnId: 'done',
    priority: 'urgent',
    projectId: 'prj-pcc-01',
    projectName: 'Personal Control Center (PCC)',
    dueDate: '2026-08-15',
    recurrence: 'daily',
    subtasks: [
      { id: 'sub-11', title: 'Review calendar commitments', completed: true },
      { id: 'sub-12', title: 'Pick primary 2-hour focus block task', completed: true },
    ],
    tags: ['Routine', 'Productivity'],
    createdAt: '2026-08-15T07:00:00Z',
    updatedAt: '2026-08-15T08:30:00Z',
  },
  {
    id: 'tsk-05',
    title: 'Design System Polish: WCAG Contrast & Keyboard Navigation',
    description: 'Ensure all buttons, inputs, modal dialogs, and tabs have complete keyboard focus-visible rings.',
    status: 'todo',
    columnId: 'waiting',
    priority: 'medium',
    projectId: 'prj-cv-02',
    projectName: 'Executive Portfolio & Career Revamp',
    dueDate: '2026-08-20',
    recurrence: 'none',
    subtasks: [
      { id: 'sub-13', title: 'Verify focus outline on all interactive elements', completed: false },
      { id: 'sub-14', title: 'Test screen reader announcements', completed: false },
    ],
    tags: ['A11y', 'Design'],
    createdAt: '2026-08-13T14:00:00Z',
    updatedAt: '2026-08-13T14:00:00Z',
  },
  {
    id: 'tsk-06',
    title: 'Weekly Systems Retrospective & Metric Calibration',
    description: 'Analyze weekly velocity, review sleep/exercise metrics, and reorganize backlog.',
    status: 'todo',
    columnId: 'todo',
    priority: 'medium',
    projectId: 'prj-fit-04',
    projectName: 'Endurance & Longevity Protocol Q3',
    dueDate: '2026-08-16',
    recurrence: 'weekly',
    subtasks: [
      { id: 'sub-15', title: 'Calculate completed tasks vs planned', completed: false },
      { id: 'sub-16', title: 'Log cardio volume & recovery scores', completed: false },
    ],
    tags: ['Review', 'Weekly'],
    createdAt: '2026-08-10T18:00:00Z',
    updatedAt: '2026-08-10T18:00:00Z',
  },
];

const STORAGE_KEY = 'pcc_tasks_store_v1';

const loadStoredTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse tasks from localStorage', err);
  }
  return INITIAL_TASKS;
};

const saveTasks = (tasks: Task[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (err) {
    console.warn('Failed to save tasks to localStorage', err);
  }
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: loadStoredTasks(),
  activeTaskId: null,
  viewMode: 'list',
  filterStatus: 'all',
  filterPriority: 'all',
  filterDueDate: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,

  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverTasks = await tasksApi.getAll();
      if (serverTasks && Array.isArray(serverTasks) && serverTasks.length > 0) {
        set({ tasks: serverTasks, isLoading: false });
        saveTasks(serverTasks);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addTask: async (taskData) => {
    const now = new Date().toISOString();
    const columnId: KanbanColumnId =
      taskData.columnId ||
      (taskData.status === 'completed'
        ? 'done'
        : taskData.status === 'in_progress'
        ? 'in_progress'
        : 'todo');

    const newTask: Task = {
      ...taskData,
      id: generateId('tsk'),
      columnId,
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
      dependencies: taskData.dependencies || [],
      recurrence: taskData.recurrence || 'none',
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await tasksApi.create(newTask);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.tasks];
          saveTasks(updated);
          return { tasks: updated };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [newTask, ...state.tasks];
      saveTasks(updated);
      return { tasks: updated };
    });
    return newTask;
  },

  updateTask: async (id, updates) => {
    const now = new Date().toISOString();
    try {
      await tasksApi.update(id, updates);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== id) return t;
        let columnId = t.columnId;
        if (updates.status) {
          columnId =
            updates.status === 'completed'
              ? 'done'
              : updates.status === 'in_progress'
              ? 'in_progress'
              : 'todo';
        }
        return {
          ...t,
          ...updates,
          columnId: updates.columnId || columnId,
          updatedAt: now,
        };
      });
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  deleteTask: async (id) => {
    try {
      await tasksApi.delete(id);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.tasks.filter((t) => t.id !== id);
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  toggleTaskComplete: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const isCurrentlyCompleted = task.status === 'completed';
    const newStatus: TaskStatus = isCurrentlyCompleted ? 'todo' : 'completed';
    const newColumnId: KanbanColumnId = isCurrentlyCompleted ? 'todo' : 'done';

    await get().updateTask(id, {
      status: newStatus,
      columnId: newColumnId,
    });
  },

  moveTaskColumn: async (id, columnId) => {
    let newStatus: TaskStatus = 'todo';
    if (columnId === 'done') newStatus = 'completed';
    else if (columnId === 'in_progress') newStatus = 'in_progress';
    else if (columnId === 'waiting') newStatus = 'todo';

    await get().updateTask(id, {
      columnId,
      status: newStatus,
    });
  },

  addSubtask: (taskId, title) => {
    if (!title.trim()) return;
    const now = new Date().toISOString();
    const newSubtask: SubTask = {
      id: generateId('sub'),
      title: title.trim(),
      completed: false,
    };

    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = [...(t.subtasks || []), newSubtask];
        return { ...t, subtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  toggleSubtask: (taskId, subtaskId) => {
    const now = new Date().toISOString();
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  deleteSubtask: (taskId, subtaskId) => {
    const now = new Date().toISOString();
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const subtasks = (t.subtasks || []).filter((st) => st.id !== subtaskId);
        return { ...t, subtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });
  },

  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterDueDate: (filterDueDate) => set({ filterDueDate }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getTaskById: (id) => get().tasks.find((t) => t.id === id),
}));
