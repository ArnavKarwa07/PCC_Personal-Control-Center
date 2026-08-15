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
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
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
  const token = useAuthStore.getState().token;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE}${API_PREFIX}${cleanPath}`;

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

    return (await response.json()) as T;
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
  getAll: () => apiClient.get<Project[]>('/projects'),
  getById: (id: string) => apiClient.get<Project>(`/projects/${id}`),
  create: (data: Partial<Project>) => apiClient.post<Project>('/projects', data),
  update: (id: string, data: Partial<Project>) => apiClient.put<Project>(`/projects/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/projects/${id}`),
};

export const tasksApi = {
  getAll: (params?: { projectId?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.projectId) query.append('project_id', params.projectId);
    if (params?.status) query.append('status', params.status);
    const qs = query.toString();
    return apiClient.get<Task[]>(`/tasks${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<Task>(`/tasks/${id}`),
  create: (data: Partial<Task>) => apiClient.post<Task>('/tasks', data),
  update: (id: string, data: Partial<Task>) => apiClient.put<Task>(`/tasks/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/tasks/${id}`),
};

export const notesApi = {
  getAll: (category?: string) => {
    const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
    return apiClient.get<Note[]>(`/notes${query}`);
  },
  getById: (id: string) => apiClient.get<Note>(`/notes/${id}`),
  create: (data: Partial<Note>) => apiClient.post<Note>('/notes', data),
  update: (id: string, data: Partial<Note>) => apiClient.put<Note>(`/notes/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notes/${id}`),
};

export const ideasApi = {
  getAll: (status?: string) => {
    const query = status && status !== 'all' ? `?status=${encodeURIComponent(status)}` : '';
    return apiClient.get<Idea[]>(`/ideas${query}`);
  },
  getById: (id: string) => apiClient.get<Idea>(`/ideas/${id}`),
  create: (data: Partial<Idea>) => apiClient.post<Idea>('/ideas', data),
  update: (id: string, data: Partial<Idea>) => apiClient.put<Idea>(`/ideas/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/ideas/${id}`),
  promote: (id: string, promotion: { type: 'task' | 'project'; title?: string; projectId?: string }) =>
    apiClient.post<Idea>(`/ideas/${id}/promote`, promotion),
};

export const calendarApi = {
  getAll: (params?: { start?: string; end?: string; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.start) query.append('start', params.start);
    if (params?.end) query.append('end', params.end);
    if (params?.type) query.append('type', params.type);
    const qs = query.toString();
    return apiClient.get<CalendarEvent[]>(`/calendar${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<CalendarEvent>(`/calendar/${id}`),
  create: (data: Partial<CalendarEvent>) => apiClient.post<CalendarEvent>('/calendar', data),
  update: (id: string, data: Partial<CalendarEvent>) => apiClient.put<CalendarEvent>(`/calendar/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/calendar/${id}`),
};

export const remindersApi = {
  getAll: () => apiClient.get<Reminder[]>('/reminders'),
  getById: (id: string) => apiClient.get<Reminder>(`/reminders/${id}`),
  create: (data: Partial<Reminder>) => apiClient.post<Reminder>('/reminders', data),
  update: (id: string, data: Partial<Reminder>) => apiClient.put<Reminder>(`/reminders/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/reminders/${id}`),
  snooze: (id: string, snoozedUntil: string) =>
    apiClient.post<Reminder>(`/reminders/${id}/snooze`, { snoozedUntil }),
};

export const alarmsApi = {
  getAll: () => apiClient.get<Alarm[]>('/alarms'),
  getById: (id: string) => apiClient.get<Alarm>(`/alarms/${id}`),
  create: (data: Partial<Alarm>) => apiClient.post<Alarm>('/alarms', data),
  update: (id: string, data: Partial<Alarm>) => apiClient.put<Alarm>(`/alarms/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/alarms/${id}`),
  toggle: (id: string, enabled: boolean) => apiClient.patch<Alarm>(`/alarms/${id}/toggle`, { enabled }),
};

export const notificationsApi = {
  getAll: () => apiClient.get<AppNotification[]>('/notifications'),
  markAsRead: (id: string) => apiClient.patch<AppNotification>(`/notifications/${id}/read`, {}),
  markAllAsRead: () => apiClient.post<{ success: boolean }>('/notifications/mark-all-read', {}),
  delete: (id: string) => apiClient.delete<{ success: boolean }>(`/notifications/${id}`),
  clearAll: () => apiClient.delete<{ success: boolean }>('/notifications'),
};

export const integrationsApi = {
  getAll: () => apiClient.get<Integration[]>('/integrations'),
  update: (id: string, data: Partial<Integration>) => apiClient.put<Integration>(`/integrations/${id}`, data),
  connect: (id: string, config: Record<string, string>) =>
    apiClient.post<Integration>(`/integrations/${id}/connect`, config),
  disconnect: (id: string) => apiClient.post<Integration>(`/integrations/${id}/disconnect`, {}),
  sync: (id: string) => apiClient.post<{ success: boolean; lastSynced: string }>(`/integrations/${id}/sync`, {}),
};

export const weatherApi = {
  getCurrent: (city?: string) => {
    const query = city ? `?city=${encodeURIComponent(city)}` : '';
    return apiClient.get<WeatherData>(`/weather${query}`);
  },
};

