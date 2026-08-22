/* ==========================================================================
   PCC (Personal Control Center) - Core TypeScript Types
   ========================================================================== */

export interface User {
  id: string;
  email: string;
  name: string;
  full_name?: string;
  avatarUrl?: string;
  role?: string;
  created_at?: string;
  createdAt?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User) => void;
  resetToMockToken: () => void;
}

export type Theme = 'dark' | 'light';
export type AccentColor = 'indigo' | 'emerald' | 'violet' | 'amber';

export interface UIState {
  sidebarCollapsed: boolean;
  theme: Theme;
  accentColor: AccentColor;
  commandPaletteOpen: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: Theme) => void;
  setAccentColor: (color: AccentColor) => void;
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

export interface NoteChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  category: string;
  pinned: boolean;
  tags?: string[];
  type?: 'text' | 'checklist';
  checklistItems?: NoteChecklistItem[];
  color?: string;
  archived?: boolean;
  trashed?: boolean;
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
  category?: string;
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
  | 'discord'
  | 'teams_calendar'
  | 'slack'
  | 'gitlab'
  | 'jira';

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

export type ReviewStatus = 'draft' | 'completed';
export type ReviewSection = 'accomplishments' | 'outstanding' | 'reflection' | 'next_week';

export interface ReviewEntry {
  id: string;
  review_id: string;
  user_id: string;
  section: ReviewSection;
  content: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  status: ReviewStatus;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
  entries?: ReviewEntry[];
}

export interface ReviewStats {
  total_reviews: number;
  completed_reviews: number;
  draft_reviews: number;
  completion_rate: number;
  streak_weeks: number;
}

export type LearningResourceType = 'course' | 'book' | 'video' | 'tutorial' | 'certification' | 'technology';
export type LearningStatus = 'saved' | 'planned' | 'learning' | 'practicing' | 'completed';

export interface LearningItem {
  id: string;
  user_id?: string;
  userId?: string;
  title: string;
  resource_type: LearningResourceType;
  resourceType?: LearningResourceType;
  url?: string;
  status: LearningStatus;
  progress: number;
  notes?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

export interface LearningStats {
  total: number;
  completed: number;
  in_progress?: number;
  inProgress?: number;
  saved: number;
  planned: number;
  practicing: number;
  by_type?: Record<string, number>;
  byType?: Record<string, number>;
  average_progress?: number;
  averageProgress?: number;
}

/* ==========================================================================
   Global Search Types
   ========================================================================== */

export type SearchEntityType =
  | 'task'
  | 'project'
  | 'note'
  | 'idea'
  | 'calendar_event'
  | 'contact'
  | 'goal'
  | 'finance'
  | 'reminder';

export interface SearchResultItem {
  id: string;
  entity_type: SearchEntityType;
  title: string;
  snippet?: string;
  relevance: number;
  url: string;
  metadata?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface SearchMeta {
  query: string;
  total: number;
  types_searched: string[];
  counts_by_type: Record<string, number>;
  limit: number;
  offset: number;
}

export interface SearchResponse {
  data: SearchResultItem[];
  meta: SearchMeta;
}

/* ==========================================================================
   Health, Fitness & Life OS Types
   ========================================================================== */

export type ExerciseType = 'strength' | 'cardio' | 'flexibility';

export interface ExerciseItem {
  id?: string;
  workout_id?: string;
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration_seconds?: number;
  exercise_type?: ExerciseType;
}

export interface WorkoutItem {
  id: string;
  user_id?: string;
  date: string;
  name?: string;
  notes?: string;
  duration_minutes?: number;
  exercises?: ExerciseItem[];
}

export interface FitnessSummary {
  total_workouts: number;
  total_duration_minutes: number;
  current_habit_streak: number;
  avg_sleep_hours: number;
  avg_water_ml: number;
}

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'abandoned';

export interface GoalMilestone {
  id?: string;
  goal_id?: string;
  name: string;
  target_date?: string;
  completed_at?: string | null;
}

export interface GoalItem {
  id: string;
  user_id?: string;
  name: string;
  description?: string;
  parent_goal_id?: string;
  time_period?: string;
  status: GoalStatus;
  progress: number;
  milestones?: GoalMilestone[];
}

export type HabitCategory = 'health' | 'mindset' | 'productivity' | 'routine';

export interface HabitItem {
  id: string;
  name: string;
  icon: string;
  category: HabitCategory;
  streak: number;
  target: string;
  unit?: string;
  completedToday: boolean;
  history: boolean[];
}

export interface DailyWellness {
  waterMl: number;
  waterTargetMl: number;
  sleepHours: number;
  sleepTargetHours: number;
  sleepQuality: 'Deep & Restorative' | 'Good' | 'Fair' | 'Poor';
  workoutCompleted: boolean;
  workoutTitle?: string;
  workoutDuration?: number;
  vitalityScore: number;
}

export interface WellnessTrendDay {
  day: string;
  date: string;
  waterMl: number;
  sleepHours: number;
  workoutDone: boolean;
  habitsCompleted: number;
  habitsTotal: number;
}

