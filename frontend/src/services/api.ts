/// <reference types="vite/client" />
import type {
  ApiError,
  Project,
  Task,
  TaskStatus,
  KanbanColumnId,
  RecurrenceType,
  Note,
  Idea,
  CalendarEvent,
  Reminder,
  Alarm,
  AppNotification,
  Integration,
  WeatherData,
  SearchResponse,
  GoalItem,
} from '../types';
import { generateId } from '../utils';

const STORAGE_KEY_SERVER_URL = 'pcc_server_url';
export const DEFAULT_CLOUD_API_URL = 'https://pcc-backend-ten.vercel.app';

export function sanitizeApiBaseUrl(url: string): string {
  if (!url) return '';
  let cleaned = url.trim();
  let changed = true;
  while (changed && cleaned.length > 0) {
    changed = false;
    if (cleaned.endsWith('/')) {
      cleaned = cleaned.replace(/\/+$/, '');
      changed = true;
    }
    if (/\/api\/v1$/i.test(cleaned)) {
      cleaned = cleaned.replace(/\/api\/v1$/i, '');
      changed = true;
    }
  }
  return cleaned;
}

export function getApiBaseUrl(): string {
  let rawUrl = DEFAULT_CLOUD_API_URL;
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && saved.trim() !== '') {
      rawUrl = saved.trim();
    } else {
      const envUrl = import.meta.env.VITE_API_URL;
      if (envUrl && envUrl.trim() !== '') {
        rawUrl = envUrl.trim();
      }
    }
  } else {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.trim() !== '') {
      rawUrl = envUrl.trim();
    }
  }
  return sanitizeApiBaseUrl(rawUrl);
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || url.trim() === '') {
      localStorage.removeItem(STORAGE_KEY_SERVER_URL);
    } else {
      const sanitized = sanitizeApiBaseUrl(url);
      localStorage.setItem(STORAGE_KEY_SERVER_URL, sanitized);
    }
  }
}

const API_PREFIX = '/api/v1';

export class ApiException extends Error {
  code?: string | number;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message || 'An unexpected API error occurred');
    this.name = 'ApiException';
    this.code = error.code;
    this.details = error.details;
  }
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  customHeaders?: Record<string, string>
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  const baseUrl = getApiBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${baseUrl}${API_PREFIX}${cleanPath}`;

  const config: RequestInit = {
    method,
    headers,
  };

  if (body !== undefined) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errData: any;
      try {
        errData = await response.json();
      } catch {
        errData = {
          message: `HTTP Error ${response.status}: ${response.statusText}`,
          code: response.status,
        };
      }
      const errPayload = errData.error || errData;
      throw new ApiException({
        message: errPayload.message || `Request failed with status ${response.status}`,
        code: errPayload.code || response.status,
        details: errPayload.details,
      });
    }

    if (response.status === 204) {
      return {} as T;
    }

    const rawJson = await response.json();
    return normalizeApiResponse<T>(rawJson);
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    throw new ApiException({
      message: error instanceof Error ? error.message : 'Network error occurred',
      code: 'NETWORK_ERROR',
    });
  }
}

function normalizeItem(item: any): any {
  if (Array.isArray(item)) {
    return item.map(normalizeItem);
  }
  if (item !== null && Object.prototype.toString.call(item) === '[object Object]') {
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(item)) {
      const camelKey = key.replace(/_([a-z0-9])/gi, (_, letter) => letter.toUpperCase());
      const mappedVal = normalizeItem(val);
      normalized[camelKey] = mappedVal;
      if (camelKey !== key) {
        normalized[key] = mappedVal;
      }
    }
    return normalized;
  }
  return item;
}

function normalizeApiResponse<T>(resJson: any): T {
  if (!resJson) return resJson as T;
  if (
    typeof resJson === 'object' &&
    resJson !== null &&
    'data' in resJson &&
    resJson.data !== undefined
  ) {
    if ('meta' in resJson || 'pagination' in resJson) {
      return {
        data: normalizeItem(resJson.data),
        meta: resJson.meta || resJson.pagination,
      } as T;
    }
    return normalizeItem(resJson.data) as T;
  }
  return normalizeItem(resJson) as T;
}

export const apiClient = {
  get: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('GET', path, undefined, headers),

  post: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('POST', path, body, headers),

  patch: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PATCH', path, body, headers),

  put: <T>(path: string, body?: unknown, headers?: Record<string, string>) =>
    request<T>('PUT', path, body, headers),

  delete: <T>(path: string, headers?: Record<string, string>) =>
    request<T>('DELETE', path, undefined, headers),
};

/* ==========================================================================
   Typed Feature API Endpoints
   ========================================================================== */

function sanitizeProjectPayload(data: Partial<Project> | any, isCreate = false): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if ('title' in payload && !payload.name) {
    payload.name = payload.title;
  }
  if (isCreate) {
    if (!payload.name || !String(payload.name).trim()) {
      payload.name = payload.title?.trim() || 'Untitled Project';
    }
  } else {
    // On update, only send name if title or name was explicitly provided
    if (('title' in data || 'name' in data) && (!payload.name || !String(payload.name).trim())) {
      payload.name = 'Untitled Project';
    }
  }
  if ('dueDate' in payload) {
    if (!payload.deadline && payload.dueDate) {
      payload.deadline = payload.dueDate;
    }
    delete payload.dueDate;
  }
  if ('startDate' in payload) {
    if (!payload.start_date && payload.startDate) {
      payload.start_date = payload.startDate;
    }
    delete payload.startDate;
  }
  delete payload.title;
  delete payload.tasksCount;
  delete payload.completedTasksCount;
  delete payload.createdAt;
  delete payload.created_at;
  delete payload.updatedAt;
  delete payload.updated_at;
  return payload;
}

function normalizeProject(p: any): Project {
  if (!p) return p;
  const deadlineStr = p.dueDate || p.deadline || undefined;
  const startDateStr = p.startDate || p.start_date || undefined;
  return {
    ...p,
    id: p.id ? String(p.id) : generateId('prj'),
    name: p.name || p.title || 'Untitled Project',
    title: p.title || p.name || 'Untitled Project',
    description: p.description || undefined,
    status: p.status || 'active',
    category: p.category || 'General',
    progress: typeof p.progress === 'number' ? p.progress : 0,
    dueDate: deadlineStr ? String(deadlineStr).split('T')[0] : undefined,
    startDate: startDateStr ? String(startDateStr).split('T')[0] : undefined,
    tasksCount: p.tasksCount !== undefined ? p.tasksCount : p.tasks_count || 0,
    completedTasksCount: p.completedTasksCount !== undefined ? p.completedTasksCount : p.completed_tasks_count || 0,
    createdAt: p.createdAt || p.created_at || new Date().toISOString(),
    updatedAt: p.updatedAt || p.updated_at || new Date().toISOString(),
  };
}

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await apiClient.get<any>('/projects/list_projects');
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items.map(normalizeProject);
  },
  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get<any>(`/projects/get_project_by_id/${id}`);
    return normalizeProject(res);
  },
  create: async (data: Partial<Project>): Promise<Project> => {
    const payload = sanitizeProjectPayload(data, true);
    const res = await apiClient.post<any>('/projects/create_project', payload);
    return normalizeProject(res);
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const payload = sanitizeProjectPayload(data);
    const res = await apiClient.patch<any>(`/projects/update_project_by_id/${id}`, payload);
    return normalizeProject(res);
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/projects/delete_project_by_id/${id}`),
};

/* ==========================================================================
   Task & Alarm Payload Normalization Helpers
   ========================================================================== */

function sanitizeTaskPayload(data: Partial<Task> | any): Record<string, any> {
  const payload: Record<string, any> = { ...data };

  // Remove frontend-only properties that backend rejects
  delete payload.columnId;
  delete payload.subtasks;
  delete payload.dependencies;
  delete payload.projectName;
  delete payload.order;
  delete payload.createdAt;
  delete payload.updatedAt;

  // Convert camelCase keys to snake_case for backend compatibility
  if ('dueDate' in payload) {
    if (payload.dueDate) payload.due_date = payload.dueDate;
    delete payload.dueDate;
  }
  if ('projectId' in payload) {
    if (payload.projectId) payload.project_id = payload.projectId;
    delete payload.projectId;
  }
  if ('goalId' in payload) {
    if (payload.goalId) payload.goal_id = payload.goalId;
    delete payload.goalId;
  }
  if ('dueTime' in payload) {
    if (payload.dueTime) payload.due_time = payload.dueTime;
    delete payload.dueTime;
  }
  if ('estimatedMinutes' in payload) {
    if (payload.estimatedMinutes !== undefined) payload.estimated_minutes = payload.estimatedMinutes;
    delete payload.estimatedMinutes;
  }

  // Convert status: 'completed' -> 'done', 'in_progress' -> 'in_progress', 'todo' -> 'todo'
  if (payload.status === 'completed') {
    payload.status = 'done';
  } else if (payload.status === 'in_progress') {
    payload.status = 'in_progress';
  } else if (payload.status === 'todo') {
    payload.status = 'todo';
  }

  // Strip recurrence if 'none' or not an object so Pydantic validation doesn't fail with 422
  if (
    payload.recurrence === 'none' ||
    typeof payload.recurrence !== 'object' ||
    payload.recurrence === null
  ) {
    delete payload.recurrence;
  }

  return payload;
}

function normalizeTask(t: any): Task {
  if (!t) return t;
  const rawStatus = t.status;
  const status: TaskStatus =
    rawStatus === 'done' || rawStatus === 'completed'
      ? 'completed'
      : rawStatus === 'in_progress'
      ? 'in_progress'
      : rawStatus === 'cancelled' || rawStatus === 'archived'
      ? 'archived'
      : 'todo';

  const columnId: KanbanColumnId =
    t.columnId ||
    (status === 'completed' ? 'done' : status === 'in_progress' ? 'in_progress' : 'todo');

  return {
    ...t,
    id: t.id ? String(t.id) : generateId('tsk'),
    title: t.title || '',
    description: t.description || undefined,
    status,
    priority: t.priority || 'medium',
    columnId,
    dueDate: t.dueDate || t.due_date || undefined,
    projectId: t.projectId || t.project_id || undefined,
    subtasks: Array.isArray(t.subtasks) ? t.subtasks : [],
    tags: Array.isArray(t.tags) ? t.tags : [],
    dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
    recurrence: typeof t.recurrence === 'string' ? (t.recurrence as RecurrenceType) : 'none',
    createdAt: t.createdAt || t.created_at || new Date().toISOString(),
    updatedAt: t.updatedAt || t.updated_at || new Date().toISOString(),
  };
}

const DAYS_ABBR = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function parseDaysOfWeekString(daysStr?: string | null): number[] {
  if (!daysStr) return [];
  const map: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };
  return daysStr
    .split(',')
    .map((s) => map[s.trim().toUpperCase()])
    .filter((n) => n !== undefined);
}

function formatDaysToWeekString(days?: number[] | string | null): string | null {
  if (!days) return null;
  if (typeof days === 'string') return days;
  if (Array.isArray(days) && days.length > 0) {
    return days.map((d) => DAYS_ABBR[d] || d).join(',');
  }
  return null;
}

function normalizeAlarm(a: any): Alarm {
  if (!a) return a;
  const time = typeof a.time === 'string' ? a.time.slice(0, 5) : a.time || '07:00';
  const enabled =
    a.enabled !== undefined
      ? a.enabled
      : a.isEnabled !== undefined
      ? a.isEnabled
      : a.is_enabled !== undefined
      ? a.is_enabled
      : true;

  const days = Array.isArray(a.days)
    ? a.days
    : parseDaysOfWeekString(a.daysOfWeek || a.days_of_week);

  return {
    ...a,
    id: a.id ? String(a.id) : generateId('alm'),
    time,
    label: a.label || '',
    enabled: Boolean(enabled),
    days: days || [],
    sound: a.sound || 'radiant',
    snoozeMinutes: a.snoozeMinutes || a.snooze_minutes || 10,
    createdAt: a.createdAt || a.created_at || new Date().toISOString(),
    updatedAt: a.updatedAt || a.updated_at || new Date().toISOString(),
  };
}

export const tasksApi = {
  getAll: async (params?: { projectId?: string; status?: string }): Promise<Task[]> => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.status) {
      const backendStatus = params.status === 'completed' ? 'done' : params.status;
      query.append('status', backendStatus);
    }
    const qs = query.toString();
    const res = await apiClient.get<any[]>(`/tasks/list_tasks${qs ? `?${qs}` : ''}`);
    if (Array.isArray(res)) {
      return res.map(normalizeTask);
    }
    return [];
  },
  getById: async (id: string): Promise<Task> => {
    const res = await apiClient.get<any>(`/tasks/get_task_by_id/${id}`);
    return normalizeTask(res);
  },
  create: async (data: Partial<Task>): Promise<Task> => {
    const payload = sanitizeTaskPayload(data);
    const res = await apiClient.post<any>('/tasks/create_task', payload);
    return normalizeTask(res);
  },
  update: async (id: string, data: Partial<Task>): Promise<Task> => {
    const payload = sanitizeTaskPayload(data);
    const res = await apiClient.patch<any>(`/tasks/update_task_by_id/${id}`, payload);
    return normalizeTask(res);
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/tasks/delete_task_by_id/${id}`),
};

function sanitizeNotePayload(data: Partial<Note> | any): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if ('pinned' in payload) {
    payload.is_pinned = payload.pinned;
    delete payload.pinned;
  }
  if ('isPinned' in payload) {
    payload.is_pinned = payload.isPinned;
    delete payload.isPinned;
  }
  delete payload.createdAt;
  delete payload.created_at;
  delete payload.updatedAt;
  delete payload.updated_at;
  return payload;
}

function normalizeNote(n: any): Note {
  if (!n) return n;
  const pinned =
    n.pinned !== undefined
      ? Boolean(n.pinned)
      : n.isPinned !== undefined
      ? Boolean(n.isPinned)
      : n.is_pinned !== undefined
      ? Boolean(n.is_pinned)
      : false;

  return {
    ...n,
    id: n.id ? String(n.id) : generateId('not'),
    title: n.title || '',
    content: n.content || '',
    category: n.category || 'General',
    pinned,
    isPinned: pinned,
    is_pinned: pinned,
    createdAt: n.createdAt || n.created_at || new Date().toISOString(),
    updatedAt: n.updatedAt || n.updated_at || new Date().toISOString(),
  };
}

export const notesApi = {
  getAll: async (category?: string): Promise<Note[]> => {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    const res = await apiClient.get<any>(`/notes/list_notes${query}`);
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items.map(normalizeNote);
  },
  getById: async (id: string): Promise<Note> => {
    const res = await apiClient.get<any>(`/notes/get_note_by_id/${id}`);
    return normalizeNote(res);
  },
  create: async (data: Partial<Note>): Promise<Note> => {
    const payload = sanitizeNotePayload(data);
    const res = await apiClient.post<any>('/notes/create_note', payload);
    return normalizeNote(res);
  },
  update: async (id: string, data: Partial<Note>): Promise<Note> => {
    const payload = sanitizeNotePayload(data);
    const res = await apiClient.patch<any>(`/notes/update_note_by_id/${id}`, payload);
    return normalizeNote(res);
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notes/delete_note_by_id/${id}`),
};

export const ideasApi = {
  getAll: async (status?: string): Promise<Idea[]> => {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    const res = await apiClient.get<any>(`/ideas/list_ideas${query}`);
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items;
  },
  getById: (id: string) => apiClient.get<Idea>(`/ideas/get_idea_by_id/${id}`),
  create: (data: Partial<Idea>) => apiClient.post<Idea>('/ideas/create_idea', data),
  update: (id: string, data: Partial<Idea>) => apiClient.patch<Idea>(`/ideas/update_idea_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/ideas/delete_idea_by_id/${id}`),
  promote: async (id: string, promotion: { type: 'task' | 'project'; title?: string; projectId?: string }) => {
    const res = await apiClient.post<any>(`/ideas/promote_idea_by_id/${id}`, {
      promote_to: promotion.type,
      target_name: promotion.title || undefined,
      target_project_id: promotion.projectId || undefined,
    });
    return (res?.idea ? res.idea : res) as Idea;
  },
};

function sanitizeCalendarEventPayload(data: Partial<CalendarEvent> | any): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if ('type' in payload) {
    payload.event_type = payload.type;
    delete payload.type;
  }
  if ('eventType' in payload) {
    payload.event_type = payload.eventType;
    delete payload.eventType;
  }
  if ('startDate' in payload) {
    payload.start_time = payload.startDate;
    delete payload.startDate;
  }
  if ('startTime' in payload) {
    payload.start_time = payload.startTime;
    delete payload.startTime;
  }
  if ('endDate' in payload) {
    payload.end_time = payload.endDate;
    delete payload.endDate;
  }
  if ('endTime' in payload) {
    payload.end_time = payload.endTime;
    delete payload.endTime;
  }
  const isAllDayVal =
    payload.isAllDay !== undefined
      ? payload.isAllDay
      : payload.allDay !== undefined
      ? payload.allDay
      : payload.is_all_day !== undefined
      ? payload.is_all_day
      : payload.all_day;
  if (isAllDayVal !== undefined) {
    payload.all_day = Boolean(isAllDayVal);
    payload.is_all_day = Boolean(isAllDayVal);
    delete payload.isAllDay;
    delete payload.allDay;
  }
  delete payload.createdAt;
  delete payload.created_at;
  delete payload.updatedAt;
  delete payload.updated_at;
  return payload;
}

function normalizeCalendarEvent(e: any): CalendarEvent {
  if (!e) return e;
  const isAllDay =
    e.isAllDay !== undefined
      ? Boolean(e.isAllDay)
      : e.allDay !== undefined
      ? Boolean(e.allDay)
      : e.is_all_day !== undefined
      ? Boolean(e.is_all_day)
      : e.all_day !== undefined
      ? Boolean(e.all_day)
      : false;

  return {
    ...e,
    id: e.id ? String(e.id) : generateId('evt'),
    title: e.title || '',
    description: e.description || undefined,
    type: e.type || e.eventType || e.event_type || 'event',
    startDate: e.startDate || e.startTime || e.start_time || new Date().toISOString(),
    endDate: e.endDate || e.endTime || e.end_time || new Date().toISOString(),
    isAllDay,
    location: e.location || undefined,
    createdAt: e.createdAt || e.created_at || new Date().toISOString(),
    updatedAt: e.updatedAt || e.updated_at || new Date().toISOString(),
  };
}

export const calendarApi = {
  getAll: async (params?: { start?: string; end?: string; type?: string }): Promise<CalendarEvent[]> => {
    const query = new URLSearchParams();
    if (params?.start) query.append('start_date', params.start);
    if (params?.end) query.append('end_date', params.end);
    if (params?.type) query.append('event_type', params.type);
    const qs = query.toString();
    const res = await apiClient.get<any>(`/calendar/events/list_calendar_events${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items.map(normalizeCalendarEvent);
  },
  getById: async (id: string): Promise<CalendarEvent> => {
    const res = await apiClient.get<any>(`/calendar/events/get_calendar_event_by_id/${id}`);
    return normalizeCalendarEvent(res);
  },
  create: async (data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const payload = sanitizeCalendarEventPayload(data);
    const res = await apiClient.post<any>('/calendar/events/create_calendar_event', payload);
    return normalizeCalendarEvent(res);
  },
  update: async (id: string, data: Partial<CalendarEvent>): Promise<CalendarEvent> => {
    const payload = sanitizeCalendarEventPayload(data);
    const res = await apiClient.patch<any>(`/calendar/events/update_calendar_event_by_id/${id}`, payload);
    return normalizeCalendarEvent(res);
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/calendar/events/delete_calendar_event_by_id/${id}`),
};

function sanitizeReminderPayload(data: Partial<Reminder> | any): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  let remindAt = payload.remindAt || payload.remind_at;
  if (!remindAt && payload.dueDate) {
    let time = (payload.dueTime || '09:00').trim();
    if (/^\d:\d\d$/.test(time)) {
      time = `0${time}`;
    }
    try {
      const dt = new Date(`${payload.dueDate}T${time}:00`);
      if (!isNaN(dt.getTime())) {
        remindAt = dt.toISOString();
      }
    } catch {
      // ignore
    }
  }
  if (!remindAt) {
    remindAt = new Date().toISOString();
  }
  payload.remind_at = remindAt;

  if ('completed' in payload) {
    payload.status = payload.completed ? 'completed' : 'pending';
    payload.is_completed = payload.completed;
    delete payload.completed;
  }
  if ('isCompleted' in payload) {
    payload.status = payload.isCompleted ? 'completed' : 'pending';
    payload.is_completed = payload.isCompleted;
    delete payload.isCompleted;
  }
  delete payload.remindAt;
  delete payload.dueDate;
  delete payload.dueTime;
  delete payload.createdAt;
  delete payload.created_at;
  delete payload.updatedAt;
  delete payload.updated_at;
  return payload;
}

function normalizeReminder(r: any): Reminder {
  if (!r) return r;
  let dueDate = r.dueDate;
  let dueTime = r.dueTime;
  const remindAt = r.remindAt || r.remind_at;
  if (remindAt && (!dueDate || !dueTime)) {
    try {
      const dt = new Date(remindAt);
      if (!isNaN(dt.getTime())) {
        dueDate = dt.toISOString().split('T')[0];
        dueTime = dt.toTimeString().slice(0, 5);
      }
    } catch {
      // ignore
    }
  }
  const isCompleted =
    r.completed !== undefined
      ? Boolean(r.completed)
      : r.isCompleted !== undefined
      ? Boolean(r.isCompleted)
      : r.is_completed !== undefined
      ? Boolean(r.is_completed)
      : r.status === 'completed';

  return {
    ...r,
    id: r.id ? String(r.id) : generateId('rem'),
    title: r.title || '',
    dueDate: dueDate || new Date().toISOString().split('T')[0],
    dueTime: dueTime || '09:00',
    completed: isCompleted,
    isCompleted,
    is_completed: isCompleted,
    category: r.category || 'General',
    createdAt: r.createdAt || r.created_at || new Date().toISOString(),
    updatedAt: r.updatedAt || r.updated_at || new Date().toISOString(),
  };
}

export const remindersApi = {
  getAll: async (): Promise<Reminder[]> => {
    const res = await apiClient.get<any>('/reminders/list_reminders');
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    return items.map(normalizeReminder);
  },
  getById: async (id: string): Promise<Reminder> => {
    const res = await apiClient.get<any>(`/reminders/get_reminder_by_id/${id}`);
    return normalizeReminder(res);
  },
  create: async (data: Partial<Reminder>): Promise<Reminder> => {
    const payload = sanitizeReminderPayload(data);
    const res = await apiClient.post<any>('/reminders/create_reminder', payload);
    return normalizeReminder(res);
  },
  update: async (id: string, data: Partial<Reminder>): Promise<Reminder> => {
    const payload = sanitizeReminderPayload(data);
    const res = await apiClient.patch<any>(`/reminders/update_reminder_by_id/${id}`, payload);
    return normalizeReminder(res);
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/reminders/delete_reminder_by_id/${id}`),
  snooze: (id: string, snoozedUntil: string, snoozeMinutes?: number) =>
    apiClient.post<Reminder>(`/reminders/snooze_reminder_by_id/${id}`, {
      snooze_until: snoozedUntil,
      snooze_minutes: snoozeMinutes,
    }),
};

export const alarmsApi = {
  getAll: async (): Promise<Alarm[]> => {
    const raw = await apiClient.get<any[]>('/alarms/list_alarms');
    if (Array.isArray(raw)) {
      return raw.map(normalizeAlarm);
    }
    return [];
  },
  getById: async (id: string): Promise<Alarm> => {
    const raw = await apiClient.get<any>(`/alarms/get_alarm_by_id/${id}`);
    return normalizeAlarm(raw);
  },
  create: async (data: Partial<Alarm> | any): Promise<Alarm> => {
    const daysOfWeek = formatDaysToWeekString(data.days || data.days_of_week || data.daysOfWeek);
    let timeStr = data.time || '07:00';
    if (typeof timeStr === 'string' && timeStr.length === 5) {
      timeStr = `${timeStr}:00`;
    }

    const payload: Record<string, any> = {
      time: timeStr,
      label: data.label || 'Alarm',
      is_enabled:
        data.enabled !== undefined
          ? Boolean(data.enabled)
          : data.is_enabled !== undefined
          ? Boolean(data.is_enabled)
          : true,
      days_of_week: daysOfWeek,
      is_recurring: Boolean(daysOfWeek && daysOfWeek.length > 0),
    };

    const res = await apiClient.post<any>('/alarms/create_alarm', payload);
    return normalizeAlarm({
      ...data,
      ...res,
    });
  },
  update: async (id: string, data: Partial<Alarm> | any): Promise<Alarm> => {
    const payload: Record<string, any> = {};
    if (data.label !== undefined) payload.label = data.label;
    if (data.time !== undefined) {
      let timeStr = data.time;
      if (typeof timeStr === 'string' && timeStr.length === 5) {
        timeStr = `${timeStr}:00`;
      }
      payload.time = timeStr;
    }
    if (data.enabled !== undefined) payload.is_enabled = Boolean(data.enabled);
    if (data.is_enabled !== undefined) payload.is_enabled = Boolean(data.is_enabled);
    if (data.days !== undefined || data.days_of_week !== undefined || data.daysOfWeek !== undefined) {
      const daysOfWeek = formatDaysToWeekString(data.days || data.days_of_week || data.daysOfWeek);
      payload.days_of_week = daysOfWeek;
      payload.is_recurring = Boolean(daysOfWeek && daysOfWeek.length > 0);
    }

    const res = await apiClient.patch<any>(`/alarms/update_alarm_by_id/${id}`, payload);
    return normalizeAlarm({
      ...data,
      ...res,
    });
  },
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/alarms/delete_alarm_by_id/${id}`),
  toggle: (id: string, enabled: boolean) =>
    apiClient.patch<Alarm>(`/alarms/toggle_alarm_by_id/${id}`, { is_enabled: enabled }),
};

export const timersApi = {
  getAll: () => apiClient.get<Array<Record<string, unknown>>>('/timers/list_timers'),
  getById: (id: string) => apiClient.get<Record<string, unknown>>(`/timers/get_timer_by_id/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/timers/create_timer', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/timers/update_timer_by_id/${id}`, data),
  updateState: (id: string, action: string, remainingSeconds?: number) =>
    apiClient.patch<Record<string, unknown>>(`/timers/update_timer_state_by_id/${id}`, { action, remaining_seconds: remainingSeconds }),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/timers/delete_timer_by_id/${id}`),
};

export const notificationsApi = {
  getAll: () => apiClient.get<AppNotification[]>('/notifications/list_notifications'),
  markAsRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/mark_notification_as_read/${id}`, {}),
  markAllAsRead: () => apiClient.patch<{ success: boolean }>('/notifications/mark_all_notifications_as_read', {}),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notifications/delete_notification_by_id/${id}`),
  clearAll: () => apiClient.delete<{ success: boolean }>('/notifications/clear_all_notifications').catch(() => apiClient.delete<{ success: boolean }>('/notifications')),
};

export const integrationsApi = {
  getAll: () => apiClient.get<Integration[]>('/integrations/list_integrations'),
  update: (provider: string, data: Partial<Integration>) => apiClient.put<Integration>(`/integrations/${provider}`, data),
  connect: (provider: string, config: Record<string, string>) => apiClient.post<Integration>(`/integrations/connect_integration/${provider}`, config),
  disconnect: (provider: string) => apiClient.post<Integration>(`/integrations/disconnect_integration/${provider}`, {}),
  getStatus: (provider: string) => apiClient.get<Integration>(`/integrations/get_integration_status/${provider}`),
  sync: (provider: string) => apiClient.post<{ success: boolean; lastSynced: string }>(`/integrations/sync_integration/${provider}`, {}).catch(() => apiClient.post<{ success: boolean; lastSynced: string }>(`/integrations/${provider}/sync`, {})),
};

export const weatherApi = {
  getCurrent: (params?: { lat?: number; lon?: number; city?: string; units?: string }) => {
    const query = new URLSearchParams();
    if (params?.lat !== undefined) query.append('lat', String(params.lat));
    if (params?.lon !== undefined) query.append('lon', String(params.lon));
    if (params?.city) query.append('city', params.city);
    if (params?.units) query.append('units', params.units);
    const qs = query.toString();
    return apiClient.get<WeatherData | { data: WeatherData }>(`/weather/get_current_weather${qs ? `?${qs}` : ''}`);
  },
  getCurrentWeather: (params?: { lat?: number; lon?: number; city?: string; units?: string }) => {
    const query = new URLSearchParams();
    if (params?.lat !== undefined) query.append('lat', String(params.lat));
    if (params?.lon !== undefined) query.append('lon', String(params.lon));
    if (params?.city) query.append('city', params.city);
    if (params?.units) query.append('units', params.units);
    const qs = query.toString();
    return apiClient.get<WeatherData | { data: WeatherData }>(`/weather/get_current_weather${qs ? `?${qs}` : ''}`);
  },
};

export const searchApi = {
  search: (params: { q: string; types?: string[]; limit?: number; offset?: number }) => {
    const query = new URLSearchParams();
    query.append('q', params.q);
    if (params.types && params.types.length > 0) {
      query.append('types', params.types.join(','));
    }
    if (params.limit !== undefined) {
      query.append('limit', String(params.limit));
    }
    if (params.offset !== undefined) {
      query.append('offset', String(params.offset));
    }
    return apiClient.get<SearchResponse>(`/search/search_entities?${query.toString()}`);
  },
};


function sanitizeGoalPayload(data: Partial<GoalItem> | any): Record<string, any> {
  const payload: Record<string, any> = { ...data };
  if ('title' in payload && !payload.name) {
    payload.name = payload.title;
    delete payload.title;
  } else if ('title' in payload) {
    delete payload.title;
  }
  const target = payload.target !== undefined ? payload.target : payload.target_value;
  const current = payload.current !== undefined ? payload.current : payload.current_value;
  if (payload.progress === undefined && target !== undefined && current !== undefined && Number(target) > 0) {
    payload.progress = Math.min(100, Math.max(0, (Number(current) / Number(target)) * 100));
  }
  delete payload.target;
  delete payload.target_value;
  delete payload.current;
  delete payload.current_value;
  delete payload.dueDate;
  delete payload.due_date;
  delete payload.createdAt;
  delete payload.created_at;
  delete payload.updatedAt;
  delete payload.updated_at;
  return payload;
}

function normalizeGoal(g: any): GoalItem {
  if (!g) return g;
  const currentVal = g.current !== undefined ? g.current : g.currentValue !== undefined ? g.currentValue : g.current_value;
  const targetVal = g.target !== undefined ? g.target : g.targetValue !== undefined ? g.targetValue : g.target_value;
  let progress = g.progress;
  if (progress === undefined && targetVal !== undefined && currentVal !== undefined && Number(targetVal) > 0) {
    progress = Math.min(100, Math.max(0, (Number(currentVal) / Number(targetVal)) * 100));
  }
  return {
    ...g,
    id: g.id ? String(g.id) : generateId('gol'),
    name: g.name || g.title || '',
    title: g.title || g.name || '',
    description: g.description || undefined,
    target: targetVal !== undefined ? Number(targetVal) : 100,
    current: currentVal !== undefined ? Number(currentVal) : 0,
    progress: progress !== undefined ? Number(progress) : 0.0,
    unit: g.unit || '%',
    category: g.category || 'General',
    dueDate: g.dueDate || g.due_date || undefined,
    status: g.status || 'in_progress',
    createdAt: g.createdAt || g.created_at || new Date().toISOString(),
    updatedAt: g.updatedAt || g.updated_at || new Date().toISOString(),
  };
}

export const goalsApi = {
  getAll: async (params?: { status?: string; time_period?: string; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.time_period) query.append('time_period', params.time_period);
    if (params?.page) query.append('page', String(params.page));
    if (params?.per_page) query.append('per_page', String(params.per_page));
    const qs = query.toString();
    const res = await apiClient.get<any>(`/goals/list_goals${qs ? `?${qs}` : ''}`);
    const items = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
    const normalizedItems = items.map(normalizeGoal);
    return {
      data: normalizedItems,
      meta: res?.meta || { total: normalizedItems.length, page: 1, per_page: 20, total_pages: 1 },
    };
  },
  create: async (data: Partial<GoalItem>): Promise<{ data: GoalItem }> => {
    const payload = sanitizeGoalPayload(data);
    const res = await apiClient.post<any>('/goals/create_goal', payload);
    return { data: normalizeGoal(res) };
  },
  update: async (id: string, data: Partial<GoalItem>): Promise<{ data: GoalItem }> => {
    const payload = sanitizeGoalPayload(data);
    const res = await apiClient.patch<any>(`/goals/update_goal_by_id/${id}`, payload);
    return { data: normalizeGoal(res) };
  },
  delete: (id: string) => apiClient.delete<void>(`/goals/delete_goal_by_id/${id}`),
};

export const assistantApi = {
  query: (query: string) => apiClient.post<Record<string, unknown>>('/assistant/process_assistant_query', { query }),
  getBriefing: () => apiClient.get<Record<string, unknown>>('/assistant/get_daily_briefing'),
};

export const contactsApi = {
  getAll: () => apiClient.get<Array<Record<string, unknown>>>('/contacts/list_contacts'),
  getById: (id: string) => apiClient.get<Record<string, unknown>>(`/contacts/get_contact_by_id/${id}`),
  create: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/contacts/create_contact', data),
  update: (id: string, data: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/contacts/update_contact_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/contacts/delete_contact_by_id/${id}`),
};

export const boardsApi = {
  create: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/boards/create_board', data),
  getById: (id: string) => apiClient.get<Record<string, unknown>>(`/boards/get_board_by_id/${id}`),
  createColumn: (boardId: string, data: Record<string, unknown>) => apiClient.post<Record<string, unknown>>(`/boards/create_board_column/${boardId}`, data),
  createCard: (data: Record<string, unknown>) => apiClient.post<Record<string, unknown>>('/boards/create_board_card', data),
  moveCard: (cardId: string, data: Record<string, unknown>) => apiClient.patch<Record<string, unknown>>(`/boards/move_board_card_by_id/${cardId}`, data),
};
