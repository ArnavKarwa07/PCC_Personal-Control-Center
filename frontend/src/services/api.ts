/// <reference types="vite/client" />
import { useAuthStore } from '../stores/authStore';
import type {
  ApiError,
  Project,
  Task,
  Note,
  Idea,
  CalendarEvent,
  Reminder,
  Alarm,
  AppNotification,
  Integration,
  WeatherData,
  SearchResponse,
  FitnessSummary,
  WorkoutItem,
  GoalItem,
} from '../types';

const STORAGE_KEY_SERVER_URL = 'pcc_server_url';
export const DEFAULT_CLOUD_API_URL = 'https://arnavkarwa07-pcc-backend.hf.space';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && saved.trim()) {
      return saved.trim().replace(/\/+$/, '');
    }
  }
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return DEFAULT_CLOUD_API_URL;
}

export function setApiBaseUrl(url: string): void {
  if (typeof window !== 'undefined') {
    if (!url || !url.trim()) {
      localStorage.removeItem(STORAGE_KEY_SERVER_URL);
    } else {
      localStorage.setItem(STORAGE_KEY_SERVER_URL, url.trim().replace(/\/+$/, ''));
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
  customHeaders?: Record<string, string>,
  isRetry = false
): Promise<T> {
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  const hasAuthHeader = Object.keys(headers).some((k) => k.toLowerCase() === 'authorization');
  if (!hasAuthHeader && token && token.trim()) {
    headers['Authorization'] = `Bearer ${token.trim()}`;
  }

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
      if (response.status === 401 && !isRetry) {
        useAuthStore.getState().logout();
        throw new ApiException({
          message: 'Unauthorized: Session expired or invalid token',
          code: 401,
        });
      }

      let errData: ApiError;
      try {
        errData = await response.json();
      } catch {
        errData = {
          message: `HTTP Error ${response.status}: ${response.statusText}`,
          code: response.status,
        };
      }
      throw new ApiException({
        message: errData.message || `Request failed with status ${response.status}`,
        code: errData.code || response.status,
        details: errData.details,
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

export const tasksApi = {
  getAll: (params?: { projectId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient.get<Task[]>(`/tasks/list_tasks${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Task>(`/tasks/get_task_by_id/${id}`),
  create: (data: Partial<Task>) => apiClient.post<Task>('/tasks/create_task', data),
  update: (id: string, data: Partial<Task>) => apiClient.patch<Task>(`/tasks/update_task_by_id/${id}`, data),
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
  getAll: () => apiClient.get<Alarm[]>('/alarms/list_alarms'),
  getById: (id: string) => apiClient.get<Alarm>(`/alarms/get_alarm_by_id/${id}`),
  create: (data: Partial<Alarm>) => apiClient.post<Alarm>('/alarms/create_alarm', data),
  update: (id: string, data: Partial<Alarm>) => apiClient.patch<Alarm>(`/alarms/update_alarm_by_id/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/alarms/delete_alarm_by_id/${id}`),
  toggle: (id: string, enabled: boolean) => apiClient.patch<Alarm>(`/alarms/toggle_alarm_by_id/${id}`, { enabled }),
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

export const fitnessApi = {
  getSummary: () => apiClient.get<FitnessSummary>('/fitness/summary'),
  getWorkouts: (page = 1, perPage = 20) => {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return apiClient.get<{
      data: WorkoutItem[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/fitness/workouts?${query.toString()}`);
  },
  createWorkout: (data: {
    date: string;
    name?: string;
    notes?: string;
    duration_minutes?: number;
    exercises?: Array<{
      name: string;
      sets?: number;
      reps?: number;
      weight?: number;
      duration_seconds?: number;
      exercise_type?: string;
    }>;
  }) => apiClient.post<{ data: WorkoutItem }>('/fitness/workouts', data),
  deleteWorkout: (id: string) => apiClient.delete<void>(`/fitness/workouts/${id}`),
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
