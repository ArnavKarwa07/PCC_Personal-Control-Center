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
    }
    return normalized;
  }
  return item;
}

function normalizeApiResponse<T>(resJson: any): T {
  if (!resJson) return resJson as T;
  let data = resJson;
  if (
    typeof resJson === 'object' &&
    resJson !== null &&
    'data' in resJson &&
    resJson.data !== undefined &&
    !('meta' in resJson) &&
    !('pagination' in resJson)
  ) {
    // Standard single data wrapper or status envelope
    const keys = Object.keys(resJson);
    const isEnvelope = keys.every((k) => ['data', 'status', 'success', 'message', 'code'].includes(k));
    if (isEnvelope) {
      data = resJson.data;
    }
  }
  return normalizeItem(data) as T;
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

export const projectsApi = {
  getAll: () => apiClient.get<Project[]>('/projects/list_projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/get_project_by_id/${id}`),
  create: (data: Partial<Project>) => apiClient.post<Project>('/projects/create_project', data),
  update: (id: string, data: Partial<Project>) => apiClient.patch<Project>(`/projects/update_project_by_id/${id}`, data),
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

export const notesApi = {
  getAll: (category?: string) => {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return apiClient.get<Note[]>(`/notes/list_notes${query}`);
  },
  getById: (id: string) => apiClient.get<Note>(`/notes/get_note_by_id/${id}`),
  create: (data: Partial<Note>) => apiClient.post<Note>('/notes/create_note', data),
  update: (id: string, data: Partial<Note>) => apiClient.patch<Note>(`/notes/update_note_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notes/delete_note_by_id/${id}`),
};

export const ideasApi = {
  getAll: (status?: string) => {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get<Idea[]>(`/ideas/list_ideas${query}`);
  },
  getById: (id: string) => apiClient.get<Idea>(`/ideas/get_idea_by_id/${id}`),
  create: (data: Partial<Idea>) => apiClient.post<Idea>('/ideas/create_idea', data),
  update: (id: string, data: Partial<Idea>) => apiClient.patch<Idea>(`/ideas/update_idea_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/ideas/delete_idea_by_id/${id}`),
  promote: (id: string, promotion: { type: 'task' | 'project'; title?: string; projectId?: string }) =>
    apiClient.post<Idea>(`/ideas/promote_idea_by_id/${id}`, promotion),
};

export const calendarApi = {
  getAll: (params?: { start?: string; end?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.start) query.append('start_date', params.start);
    if (params?.end) query.append('end_date', params.end);
    if (params?.type) query.append('event_type', params.type);
    const qs = query.toString();
    return apiClient.get<CalendarEvent[]>(`/calendar/events/list_calendar_events${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<CalendarEvent>(`/calendar/events/get_calendar_event_by_id/${id}`),
  create: (data: Partial<CalendarEvent>) => apiClient.post<CalendarEvent>('/calendar/events/create_calendar_event', data),
  update: (id: string, data: Partial<CalendarEvent>) => apiClient.patch<CalendarEvent>(`/calendar/events/update_calendar_event_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/calendar/events/delete_calendar_event_by_id/${id}`),
};

export const remindersApi = {
  getAll: () => apiClient.get<Reminder[]>('/reminders/list_reminders'),
  getById: (id: string) => apiClient.get<Reminder>(`/reminders/get_reminder_by_id/${id}`),
  create: (data: Partial<Reminder>) => apiClient.post<Reminder>('/reminders/create_reminder', data),
  update: (id: string, data: Partial<Reminder>) => apiClient.patch<Reminder>(`/reminders/update_reminder_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/reminders/delete_reminder_by_id/${id}`),
  snooze: (id: string, snoozedUntil: string) => apiClient.post<Reminder>(`/reminders/snooze_reminder_by_id/${id}`, { snoozedUntil }),
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


export const goalsApi = {
  getAll: (params?: { status?: string; time_period?: string; page?: number; per_page?: number }) => {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.time_period) query.append('time_period', params.time_period);
    if (params?.page) query.append('page', String(params.page));
    if (params?.per_page) query.append('per_page', String(params.per_page));
    const qs = query.toString();
    return apiClient.get<{
      data: GoalItem[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/goals/list_goals${qs ? `?${qs}` : ''}`);
  },
  create: (data: Partial<GoalItem>) => apiClient.post<{ data: GoalItem }>('/goals/create_goal', data),
  update: (id: string, data: Partial<GoalItem>) => apiClient.patch<{ data: GoalItem }>(`/goals/update_goal_by_id/${id}`, data),
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
