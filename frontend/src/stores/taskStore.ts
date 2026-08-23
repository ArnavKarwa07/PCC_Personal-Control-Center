import { syncQueue } from '../services/syncQueue';
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

const STORAGE_KEY_V1 = 'pcc_tasks_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_tasks';

const loadStoredTasks = (): Task[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (t: any) =>
            t.title?.includes('Implement Dark-Themed Kanban') ||
            t.title?.includes('Build Split-Pane Markdown') ||
            t.title?.includes('Setup Unified Calendar Grid') ||
            t.title?.includes('Daily Morning Deep Work')
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
    console.warn('Failed to parse tasks from localStorage', err);
  }
  return [];
};

const saveTasks = (tasks: Task[]) => {
  try {
    const data = JSON.stringify(tasks);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
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
      if (serverTasks && Array.isArray(serverTasks)) {
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
      status: taskData.status || 'todo',
      columnId,
      subtasks: taskData.subtasks || [],
      tags: taskData.tags || [],
      dependencies: taskData.dependencies || [],
      recurrence: taskData.recurrence || 'none',
      createdAt: now,
      updatedAt: now,
    };

    // Convert status for backend payload
    let backendStatus = 'todo';
    if (newTask.status === 'completed') backendStatus = 'done';
    else if (newTask.status === 'in_progress') backendStatus = 'in_progress';
    else if (newTask.status === 'todo') backendStatus = 'todo';

    // Prepare clean payload for API & offline sync
    const apiPayload: Record<string, any> = {
      title: newTask.title,
      description: newTask.description,
      status: backendStatus,
      priority: newTask.priority,
      tags: newTask.tags,
    };

    if (newTask.dueDate) {
      apiPayload.due_date = newTask.dueDate;
    }
    if (newTask.projectId) {
      apiPayload.project_id = newTask.projectId;
    }

    // Strip recurrence if it is 'none' or not an object so Pydantic validation doesn't fail with 422
    if (
      newTask.recurrence &&
      newTask.recurrence !== ('none' as any) &&
      typeof newTask.recurrence === 'object'
    ) {
      apiPayload.recurrence = newTask.recurrence;
    }

    try {
      const created = await tasksApi.create(apiPayload as any);
      if (created && created.id) {
        const returnedTask: Task = {
          ...newTask,
          ...created,
          id: String(created.id),
          status:
            (created.status as any) === 'done' || created.status === 'completed'
              ? 'completed'
              : created.status === 'in_progress'
              ? 'in_progress'
              : 'todo',
          columnId:
            created.columnId ||
            ((created.status as any) === 'done' || created.status === 'completed'
              ? 'done'
              : created.status === 'in_progress'
              ? 'in_progress'
              : 'todo'),
        };
        set((state) => {
          const updated = [returnedTask, ...state.tasks];
          saveTasks(updated);
          return { tasks: updated };
        });
        return returnedTask;
      }
    } catch (err: any) {
      const is422 =
        err?.code === 422 ||
        err?.status === 422 ||
        err?.code === '422' ||
        String(err?.message || '').includes('422');
      const isNetworkError =
        err?.code === 'NETWORK_ERROR' || !navigator.onLine;

      if (is422 || isNetworkError) {
        syncQueue.enqueue({
          entityType: 'task',
          action: 'create',
          entityId: newTask.id,
          payload: {
            ...apiPayload,
            id: newTask.id,
          },
        });
      }
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

    let targetSubtasks: SubTask[] = [];
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        targetSubtasks = [...(t.subtasks || []), newSubtask];
        return { ...t, subtasks: targetSubtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });

    tasksApi.update(taskId, { subtasks: targetSubtasks } as any).catch(() => {});
  },

  toggleSubtask: (taskId, subtaskId) => {
    const now = new Date().toISOString();
    let targetSubtasks: SubTask[] = [];
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        targetSubtasks = (t.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        return { ...t, subtasks: targetSubtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });

    tasksApi.update(taskId, { subtasks: targetSubtasks } as any).catch(() => {});
  },

  deleteSubtask: (taskId, subtaskId) => {
    const now = new Date().toISOString();
    let targetSubtasks: SubTask[] = [];
    set((state) => {
      const updated = state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        targetSubtasks = (t.subtasks || []).filter((st) => st.id !== subtaskId);
        return { ...t, subtasks: targetSubtasks, updatedAt: now };
      });
      saveTasks(updated);
      return { tasks: updated };
    });

    tasksApi.update(taskId, { subtasks: targetSubtasks } as any).catch(() => {});
  },

  setActiveTaskId: (id) => set({ activeTaskId: id }),
  setViewMode: (viewMode) => set({ viewMode }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),
  setFilterPriority: (filterPriority) => set({ filterPriority }),
  setFilterDueDate: (filterDueDate) => set({ filterDueDate }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  getTaskById: (id) => get().tasks.find((t) => t.id === id),
}));
