/* ==========================================================================
   PCC (Personal Control Center) - Core TypeScript Types
   ========================================================================== */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

export type Theme = 'dark' | 'light';

export interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms, default 5000
}

export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';
export type ProjectStatus = 'active' | 'planned' | 'completed' | 'archived' | 'on_hold';
export type KanbanColumnId = 'todo' | 'in_progress' | 'waiting' | 'done';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  columnId?: KanbanColumnId;
  order?: number;
  dueDate?: string;
  projectId?: string;
  projectName?: string;
  recurrence?: RecurrenceType;
  subtasks?: SubTask[];
  tags?: string[];
  dependencies?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  priority?: Priority;
  progress?: number;
  dueDate?: string;
  startDate?: string;
  tags?: string[];
  color?: string;
  category?: string;
  tasksCount?: number;
  completedTasksCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export type IdeaStatus = 'captured' | 'exploring' | 'promoted' | 'archived';

export interface Idea {
  id: string;
  title: string;
  description: string;
  status: IdeaStatus;
  category?: string;
  tags?: string[];
  impact?: 'low' | 'medium' | 'high';
  effort?: 'low' | 'medium' | 'high';
  promotedTo?: {
    type: 'task' | 'project';
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

export type CalendarEventType = 'event' | 'task' | 'reminder';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  type: CalendarEventType;
  startDate: string; // ISO string e.g. '2026-08-15T09:00:00'
  endDate?: string;
  allDay?: boolean;
  color?: string;
  priority?: Priority;
  location?: string;
  relatedId?: string;
  completed?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type NotificationType = 'task' | 'reminder' | 'alarm' | 'calendar' | 'system' | 'integration';
export type NotificationPriority = 'info' | 'warning' | 'urgent' | 'success';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: NotificationType;
  priority?: NotificationPriority;
  link?: string;
  createdAt: string;
}

export type ReminderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ReminderRecurrence = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface Reminder {
  id: string;
  title: string;
  notes?: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM (24-hour format)
  priority: ReminderPriority;
  completed: boolean;
  snoozedUntil?: string; // ISO string
  recurrence: ReminderRecurrence;
  tags?: string[];
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Alarm {
  id: string;
  time: string; // "07:00" in 24-hour format
  label: string;
  enabled: boolean;
  days: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  sound: string;
  snoozeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

export type TimerMode = 'pomodoro' | 'countdown' | 'stopwatch';
export type PomodoroState = 'work' | 'short_break' | 'long_break';

export interface StopwatchLap {
  lapNumber: number;
  lapTime: number; // ms
  overallTime: number; // ms
  timestamp: number;
}

export type IntegrationService =
  | 'github'
  | 'google_calendar'
  | 'weather'
  | 'telegram'
  | 'notion'
  | 'obsidian'
  | 'discord';

export interface Integration {
  id: string;
  service: IntegrationService;
  name: string;
  description: string;
  connected: boolean;
  lastSynced?: string;
  config?: Record<string, string>;
  category: 'developer' | 'calendar' | 'environment' | 'messaging' | 'knowledge';
}

export interface WeatherCondition {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'windy';
  description: string;
  humidity: number;
  windSpeed: number;
  windDirection: string;
  uvIndex: number;
  aqi: number;
  aqiStatus: string;
  pressure: number;
  visibility: number;
  sunrise: string;
  sunset: string;
}

export interface HourlyWeather {
  time: string;
  temp: number;
  condition: string;
  icon: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'windy';
  pop: number; // probability of precipitation (0-100)
}

export interface DailyWeather {
  date: string;
  dayName: string;
  tempMin: number;
  tempMax: number;
  condition: string;
  icon: 'sunny' | 'partly_cloudy' | 'cloudy' | 'rain' | 'storm' | 'snow' | 'windy';
  pop: number;
  humidity: number;
}

export interface WeatherAlert {
  id: string;
  title: string;
  severity: 'info' | 'warning' | 'severe';
  description: string;
  time: string;
}

export interface WeatherData {
  location: {
    city: string;
    country: string;
    region?: string;
    timezone?: string;
    updatedAt: string;
  };
  current: WeatherCondition;
  hourly: HourlyWeather[];
  daily: DailyWeather[];
  alerts?: WeatherAlert[];
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: string;
  badge?: number;
}

