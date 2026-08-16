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
  Review,
  ReviewSection,
  ReviewEntry,
  ReviewStats,
  LearningItem,
  LearningStats,
  SearchResponse,
  FitnessSummary,
  WorkoutItem,
  GoalItem,
  Achievement,
  ResumeVersion,
  Skill,
  Certification,
  Experience,
  CareerSummary,
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

export const reviewsApi = {
  getAll: (status?: string, page: number = 1, perPage: number = 20) => {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);
    query.append('page', String(page));
    query.append('per_page', String(perPage));
    return apiClient.get<{ data: Review[]; meta: { total: number; page: number; per_page: number; total_pages: number } }>(
      `/reviews?${query.toString()}`
    );
  },
  getById: (id: string) => apiClient.get<{ data: Review }>(`/reviews/${id}`),
  getCurrent: () => apiClient.get<{ data: Review | null }>('/reviews/current'),
  getStats: () => apiClient.get<{ data: ReviewStats }>('/reviews/stats'),
  create: (data: {
    week_start: string;
    week_end: string;
    status?: string;
    entries?: { section: string; content?: string; sort_order?: number }[];
  }) => apiClient.post<{ data: Review }>('/reviews', data),
  update: (
    id: string,
    data: {
      week_start?: string;
      week_end?: string;
      status?: string;
      completed_at?: string | null;
      entries?: { section: string; content?: string; sort_order?: number }[];
    }
  ) => apiClient.patch<{ data: Review }>(`/reviews/${id}`, data),
  upsertEntry: (
    reviewId: string,
    data: { section: string; content?: string; sort_order?: number }
  ) => apiClient.post<{ data: ReviewEntry }>(`/reviews/${reviewId}/entries`, data),
  complete: (id: string) => apiClient.patch<{ data: Review }>(`/reviews/${id}/complete`, {}),
  delete: (id: string) => apiClient.delete<{ success?: boolean }>(`/reviews/${id}`),
};

export const learningApi = {
  getAll: (params?: {
    resource_type?: string;
    status?: string;
    search?: string;
    page?: number;
    per_page?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.resource_type && params.resource_type !== 'all') {
      query.append('resource_type', params.resource_type);
    }
    if (params?.status && params.status !== 'all') {
      query.append('status', params.status);
    }
    if (params?.search) {
      query.append('search', params.search);
    }
    if (params?.page) {
      query.append('page', String(params.page));
    }
    if (params?.per_page) {
      query.append('per_page', String(params.per_page));
    }
    const qs = query.toString();
    return apiClient.get<{
      data: LearningItem[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/learning${qs ? `?${qs}` : ''}`);
  },
  getById: (id: string) => apiClient.get<{ data: LearningItem }>(`/learning/${id}`),
  getStats: () => apiClient.get<LearningStats>('/learning/stats'),
  create: (data: Partial<LearningItem>) => apiClient.post<{ data: LearningItem }>('/learning', data),
  update: (id: string, data: Partial<LearningItem>) =>
    apiClient.patch<{ data: LearningItem }>(`/learning/${id}`, data),
  delete: (id: string) => apiClient.delete<{ success?: boolean }>(`/learning/${id}`),
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
    return apiClient.get<SearchResponse>(`/search?${query.toString()}`);
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
    }>(`/goals${qs ? `?${qs}` : ''}`);
  },
  create: (data: Partial<GoalItem>) => apiClient.post<{ data: GoalItem }>('/goals', data),
  update: (id: string, data: Partial<GoalItem>) => apiClient.patch<{ data: GoalItem }>(`/goals/${id}`, data),
  delete: (id: string) => apiClient.delete<void>(`/goals/${id}`),
};

export const careerApi = {
  getSummary: () => apiClient.get<CareerSummary>('/career/summary'),

  // Achievements
  getAchievements: (params?: {
    category?: string;
    resume_relevant?: boolean;
    linkedin_relevant?: boolean;
    page?: number;
    per_page?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.category && params.category !== 'all') query.append('category', params.category);
    if (params?.resume_relevant !== undefined) query.append('resume_relevant', String(params.resume_relevant));
    if (params?.linkedin_relevant !== undefined) query.append('linkedin_relevant', String(params.linkedin_relevant));
    if (params?.page) query.append('page', String(params.page));
    if (params?.per_page) query.append('per_page', String(params.per_page));
    const qs = query.toString();
    return apiClient.get<{
      data: Achievement[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/career/achievements${qs ? `?${qs}` : ''}`);
  },
  createAchievement: (data: Partial<Achievement>) =>
    apiClient.post<{ data: Achievement }>('/career/achievements', data),
  updateAchievement: (id: string, data: Partial<Achievement>) =>
    apiClient.patch<{ data: Achievement }>(`/career/achievements/${id}`, data),
  deleteAchievement: (id: string) => apiClient.delete<void>(`/career/achievements/${id}`),

  // Skills
  getSkills: (category?: string, page = 1, perPage = 100) => {
    const query = new URLSearchParams();
    if (category && category !== 'all') query.append('category', category);
    query.append('page', String(page));
    query.append('per_page', String(perPage));
    return apiClient.get<{
      data: Skill[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/career/skills?${query.toString()}`);
  },
  createSkill: (data: Partial<Skill>) => apiClient.post<{ data: Skill }>('/career/skills', data),
  updateSkill: (id: string, data: Partial<Skill>) =>
    apiClient.patch<{ data: Skill }>(`/career/skills/${id}`, data),
  deleteSkill: (id: string) => apiClient.delete<void>(`/career/skills/${id}`),

  // Certifications
  getCertifications: (page = 1, perPage = 50) => {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return apiClient.get<{
      data: Certification[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/career/certifications?${query.toString()}`);
  },
  createCertification: (data: Partial<Certification>) =>
    apiClient.post<{ data: Certification }>('/career/certifications', data),
  updateCertification: (id: string, data: Partial<Certification>) =>
    apiClient.patch<{ data: Certification }>(`/career/certifications/${id}`, data),
  deleteCertification: (id: string) => apiClient.delete<void>(`/career/certifications/${id}`),

  // Experiences
  getExperiences: (page = 1, perPage = 50) => {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return apiClient.get<{
      data: Experience[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/career/experiences?${query.toString()}`);
  },
  createExperience: (data: Partial<Experience>) =>
    apiClient.post<{ data: Experience }>('/career/experiences', data),
  updateExperience: (id: string, data: Partial<Experience>) =>
    apiClient.patch<{ data: Experience }>(`/career/experiences/${id}`, data),
  deleteExperience: (id: string) => apiClient.delete<void>(`/career/experiences/${id}`),

  // Resumes
  getResumes: (page = 1, perPage = 50) => {
    const query = new URLSearchParams({ page: String(page), per_page: String(perPage) });
    return apiClient.get<{
      data: ResumeVersion[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/career/resumes?${query.toString()}`);
  },
  createResume: (data: Partial<ResumeVersion>) =>
    apiClient.post<{ data: ResumeVersion }>('/career/resumes', data),
  updateResume: (id: string, data: Partial<ResumeVersion>) =>
    apiClient.patch<{ data: ResumeVersion }>(`/career/resumes/${id}`, data),
  deleteResume: (id: string) => apiClient.delete<void>(`/career/resumes/${id}`),
};

export const reviewApi = {
  getAll: (status?: string, page = 1, perPage = 20) => {
    const query = new URLSearchParams();
    if (status && status !== 'all') query.append('status', status);
    query.append('page', String(page));
    query.append('per_page', String(perPage));
    return apiClient.get<{
      data: Review[];
      meta: { total: number; page: number; per_page: number; total_pages: number };
    }>(`/reviews?${query.toString()}`);
  },

  getStats: () => apiClient.get<{ data: ReviewStats }>('/reviews/stats'),

  getCurrentWeek: () => apiClient.get<{ data: Review | null }>('/reviews/current'),

  getById: (id: string) => apiClient.get<{ data: Review }>(`/reviews/${id}`),

  create: (data: { week_start?: string; week_end?: string; status?: string }) =>
    apiClient.post<{ data: Review }>('/reviews', data),

  update: (id: string, data: Partial<Review>) =>
    apiClient.patch<{ data: Review }>(`/reviews/${id}`, data),

  upsertEntry: (id: string, section: ReviewSection, content: string) =>
    apiClient.post<{ data: ReviewEntry }>(`/reviews/${id}/entries`, { section, content }),

  complete: (id: string) => apiClient.patch<{ data: Review }>(`/reviews/${id}/complete`),

  delete: (id: string) => apiClient.delete<void>(`/reviews/${id}`),
};






