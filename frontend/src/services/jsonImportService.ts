import { Task, Project, Note, Idea, CalendarEvent, Reminder, Alarm, Integration, Priority, TaskStatus, ProjectStatus, KanbanColumnId, SubTask } from '../types';
import { generateId } from '../utils';

export interface ImportValidationIssue {
  level: 'error' | 'warning';
  domain: string;
  itemIndex?: number;
  field?: string;
  message: string;
}

export interface ImportStats {
  user: number;
  tasks: number;
  projects: number;
  notes: number;
  ideas: number;
  calendarEvents: number;
  goals: number;
  contacts: number;
  reminders: number;
  alarms: number;
  integrations: number;
  weather: number;
  totalImported: number;
}

export interface ValidatedImportPayload {
  user?: Record<string, any>;
  tasks: Task[];
  projects: Project[];
  notes: Note[];
  ideas: Idea[];
  calendarEvents: CalendarEvent[];
  goals: Record<string, any>[];
  contacts: Record<string, any>[];
  reminders: Reminder[];
  alarms: Alarm[];
  integrations: Integration[];
  weather?: { selectedCity: string; unit: 'C' | 'F' };
  finances?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  stats: ImportStats;
  issues: ImportValidationIssue[];
  payload: ValidatedImportPayload;
}

/**
 * Validates a raw JSON payload string or parsed object against PCC schemas.
 * Applies sensible default fallbacks for optional or empty fields.
 */
export function validateAndCleanImportData(input: string | Record<string, any>): ImportResult {
  const issues: ImportValidationIssue[] = [];
  let raw: any;

  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input);
    } catch (err: any) {
      return {
        success: false,
        stats: createEmptyStats(),
        issues: [
          {
            level: 'error',
            domain: 'JSON Syntax',
            message: `Syntax error in JSON string: ${err?.message || 'Invalid format'}`,
          },
        ],
        payload: createEmptyPayload(),
      };
    }
  } else {
    raw = input;
  }

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      success: false,
      stats: createEmptyStats(),
      issues: [
        {
          level: 'error',
          domain: 'Root Object',
          message: 'Root JSON payload must be an object containing domain keys.',
        },
      ],
      payload: createEmptyPayload(),
    };
  }

  const payload: ValidatedImportPayload = createEmptyPayload();

  // 1. User profile validation
  if (raw.user && typeof raw.user === 'object') {
    payload.user = {
      name: raw.user.name || 'Arnav Karwa',
      email: raw.user.email || 'arnav@pcc.local',
      role: raw.user.role || 'Lead Architect',
      country: raw.user.country || 'India',
      currency: raw.user.currency || '₹ (INR)',
      timezone: raw.user.timezone || 'Asia/Kolkata',
      dateFormat: raw.user.dateFormat || 'YYYY-MM-DD',
    };
  }

  // 2. Tasks validation
  const rawTasks = raw.tasks || raw.task_list;
  if (rawTasks) {
    if (!Array.isArray(rawTasks)) {
      issues.push({ level: 'warning', domain: 'Tasks', message: 'Field "tasks" should be an array. Skipped.' });
    } else {
      rawTasks.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          issues.push({ level: 'warning', domain: 'Tasks', itemIndex: idx, message: 'Invalid task object skipped.' });
          return;
        }

        if (!item.title || typeof item.title !== 'string' || !item.title.trim()) {
          issues.push({ level: 'warning', domain: 'Tasks', itemIndex: idx, field: 'title', message: 'Task missing required title. Generated fallback title.' });
        }

        const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];
        const status: TaskStatus = validStatuses.includes(item.status) ? item.status : 'todo';

        const validPriorities: Priority[] = ['low', 'medium', 'high', 'urgent'];
        const priority: Priority = validPriorities.includes(item.priority) ? item.priority : 'medium';

        let columnId: KanbanColumnId = 'todo';
        if (status === 'in_progress') columnId = 'in_progress';
        if (status === 'completed') columnId = 'done';
        if (item.columnId) columnId = item.columnId;

        let dueDate = item.dueDate;
        if (dueDate && isNaN(Date.parse(dueDate))) {
          issues.push({ level: 'warning', domain: 'Tasks', itemIndex: idx, field: 'dueDate', message: `Corrupt date format "${dueDate}". Cleared.` });
          dueDate = undefined;
        }

        const subtasks: SubTask[] = Array.isArray(item.subtasks)
          ? item.subtasks.map((st: any, sIdx: number) => ({
              id: st.id || `sub-${idx}-${sIdx}`,
              title: st.title || 'Subtask item',
              completed: Boolean(st.completed),
            }))
          : [];

        const cleanedTask: Task = {
          id: item.id || generateId('tsk'),
          title: (item.title && String(item.title).trim()) || `Untitled Task #${idx + 1}`,
          description: item.description || '',
          status,
          priority,
          columnId,
          dueDate,
          projectId: item.projectId,
          projectName: item.projectName,
          recurrence: item.recurrence || 'none',
          subtasks,
          tags: Array.isArray(item.tags) ? item.tags.map(String) : item.category ? [item.category] : [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        payload.tasks.push(cleanedTask);
      });
    }
  }

  // 3. Projects validation
  const rawProjects = raw.projects;
  if (rawProjects) {
    if (!Array.isArray(rawProjects)) {
      issues.push({ level: 'warning', domain: 'Projects', message: 'Field "projects" should be an array. Skipped.' });
    } else {
      rawProjects.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') {
          issues.push({ level: 'warning', domain: 'Projects', itemIndex: idx, message: 'Invalid project object skipped.' });
          return;
        }

        const name = item.name || item.title || `Project #${idx + 1}`;
        if (!item.name && !item.title) {
          issues.push({ level: 'warning', domain: 'Projects', itemIndex: idx, field: 'name', message: 'Project missing name. Applied default.' });
        }

        const validStatuses: ProjectStatus[] = ['active', 'planned', 'completed', 'archived', 'on_hold'];
        const status: ProjectStatus = validStatuses.includes(item.status) ? item.status : 'active';

        const cleanedProject: Project = {
          id: item.id || generateId('prj'),
          title: name,
          description: item.description || '',
          status,
          priority: item.priority || 'medium',
          progress: typeof item.progress === 'number' ? Math.min(100, Math.max(0, item.progress)) : 0,
          dueDate: item.dueDate || item.deadline,
          startDate: item.startDate,
          tags: Array.isArray(item.tags) ? item.tags.map(String) : item.category ? [item.category] : [],
          category: item.category || 'General',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        payload.projects.push(cleanedProject);
      });
    }
  }

  // 4. Notes validation
  const rawNotes = raw.notes;
  if (rawNotes) {
    if (!Array.isArray(rawNotes)) {
      issues.push({ level: 'warning', domain: 'Notes', message: 'Field "notes" should be an array. Skipped.' });
    } else {
      rawNotes.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') return;

        const cleanedNote: Note = {
          id: item.id || generateId('nt'),
          title: item.title || `Note #${idx + 1}`,
          content: item.content || item.text || '',
          category: item.category || 'General',
          pinned: Boolean(item.pinned),
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        payload.notes.push(cleanedNote);
      });
    }
  }

  // 5. Ideas validation
  const rawIdeas = raw.ideas;
  if (rawIdeas) {
    if (Array.isArray(rawIdeas)) {
      rawIdeas.forEach((item: any, idx: number) => {
        if (!item || typeof item !== 'object') return;

        const validIdeaStatuses = ['captured', 'exploring', 'promoted', 'archived'];
        const status = validIdeaStatuses.includes(item.status) ? item.status : 'captured';

        const cleanedIdea: Idea = {
          id: item.id || generateId('id'),
          title: item.title || `Idea #${idx + 1}`,
          description: item.description || '',
          status: status as any,
          category: item.category || 'General',
          tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
          impact: item.impact || 'medium',
          effort: item.effort || item.feasibility || 'medium',
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
        };

        payload.ideas.push(cleanedIdea);
      });
    }
  }

  // 6. Calendar Events validation
  const rawEvents = raw.calendarEvents || raw.events;
  if (rawEvents && Array.isArray(rawEvents)) {
    rawEvents.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      let startDate = item.startDate || item.date || new Date().toISOString();
      if (isNaN(Date.parse(startDate))) {
        issues.push({ level: 'warning', domain: 'Calendar', itemIndex: idx, field: 'startDate', message: `Invalid date format "${startDate}". Set to today.` });
        startDate = new Date().toISOString();
      }

      const cleanedEvent: CalendarEvent = {
        id: item.id || generateId('evt'),
        title: item.title || `Event #${idx + 1}`,
        description: item.description || '',
        type: item.type || 'event',
        startDate,
        endDate: item.endDate,
        allDay: Boolean(item.isAllDay || item.allDay),
        location: item.location || '',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };

      payload.calendarEvents.push(cleanedEvent);
    });
  }

  // 7. Goals validation
  const rawGoals = raw.goals;
  if (rawGoals && Array.isArray(rawGoals)) {
    rawGoals.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      payload.goals.push({
        id: item.id || generateId('gl'),
        name: item.title || item.name || `Goal #${idx + 1}`,
        title: item.title || item.name || `Goal #${idx + 1}`,
        category: item.category || 'Personal',
        progress: typeof item.progress === 'number' ? item.progress : 0,
        targetPeriod: item.targetPeriod || item.time_period || 'Q3 2026',
        status: item.status || 'in_progress',
      });
    });
  }

  // 8. Contacts validation
  const rawContacts = raw.contacts;
  if (rawContacts && Array.isArray(rawContacts)) {
    rawContacts.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      payload.contacts.push({
        id: item.id || generateId('cnt'),
        name: item.name || `Contact #${idx + 1}`,
        role: item.role || 'Contact',
        organization: item.organization || '',
        email: item.email || '',
        phone: item.phone || '',
        lastContacted: item.lastContacted || '',
      });
    });
  }

  // 9. Reminders validation
  const rawReminders = raw.reminders;
  if (rawReminders && Array.isArray(rawReminders)) {
    rawReminders.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      const cleanedReminder: Reminder = {
        id: item.id || generateId('rmd'),
        title: item.title || `Reminder #${idx + 1}`,
        notes: item.notes || '',
        dueDate: item.dueDate || new Date().toISOString().slice(0, 10),
        dueTime: item.time || item.dueTime || '09:00',
        priority: item.priority || 'medium',
        completed: Boolean(item.completed),
        recurrence: item.recurrence || 'none',
        category: item.category || 'General',
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };

      payload.reminders.push(cleanedReminder);
    });
  }

  // 10. Alarms validation
  const rawAlarms = raw.alarms;
  if (rawAlarms && Array.isArray(rawAlarms)) {
    rawAlarms.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') return;

      const cleanedAlarm: Alarm = {
        id: item.id || generateId('alm'),
        time: item.time || '07:00',
        label: item.title || item.label || `Alarm #${idx + 1}`,
        enabled: item.enabled !== undefined ? Boolean(item.enabled) : true,
        days: Array.isArray(item.days) ? item.days : [1, 2, 3, 4, 5],
        sound: item.sound || 'radiant',
        snoozeMinutes: item.snoozeMinutes || 5,
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      };

      payload.alarms.push(cleanedAlarm);
    });
  }

  // 11. Integrations validation
  const rawIntegrations = raw.integrations;
  if (rawIntegrations && Array.isArray(rawIntegrations)) {
    rawIntegrations.forEach((item: any) => {
      if (!item || typeof item !== 'object') return;

      const service = item.service || item.provider || 'github';
      const cleanedIntegration: Integration = {
        id: item.id || `int-${service}`,
        service: service as any,
        name: item.name || `${service} Integration`,
        description: item.description || '',
        connected: Boolean(item.connected || item.isConnected),
        category: item.category || 'developer',
        config: typeof item.config === 'object' ? item.config : {},
        lastSynced: item.lastSynced || item.last_synced,
      };

      payload.integrations.push(cleanedIntegration);
    });
  }

  // 12. Weather preferences
  if (raw.weather && typeof raw.weather === 'object') {
    payload.weather = {
      selectedCity: raw.weather.selectedCity || raw.weather.city || 'Pune',
      unit: raw.weather.unit === 'F' ? 'F' : 'C',
    };
  }

  // 13. Finances
  if (raw.finances && typeof raw.finances === 'object') {
    payload.finances = {
      income: raw.finances.income || 0,
      expenses: raw.finances.expenses || 0,
      currency: raw.finances.currency || '₹ (INR)',
      subscriptions: Array.isArray(raw.finances.subscriptions) ? raw.finances.subscriptions : [],
    };
  }

  const stats: ImportStats = {
    user: payload.user ? 1 : 0,
    tasks: payload.tasks.length,
    projects: payload.projects.length,
    notes: payload.notes.length,
    ideas: payload.ideas.length,
    calendarEvents: payload.calendarEvents.length,
    goals: payload.goals.length,
    contacts: payload.contacts.length,
    reminders: payload.reminders.length,
    alarms: payload.alarms.length,
    integrations: payload.integrations.length,
    weather: payload.weather ? 1 : 0,
    totalImported:
      (payload.user ? 1 : 0) +
      payload.tasks.length +
      payload.projects.length +
      payload.notes.length +
      payload.ideas.length +
      payload.calendarEvents.length +
      payload.goals.length +
      payload.contacts.length +
      payload.reminders.length +
      payload.alarms.length +
      payload.integrations.length +
      (payload.weather ? 1 : 0),
  };

  const hasCriticalError = issues.some((i) => i.level === 'error');

  return {
    success: !hasCriticalError && stats.totalImported > 0,
    stats,
    issues,
    payload,
  };
}

/**
 * Persists the validated import payload into local storage and triggers store updates.
 */
export function executeDataImport(payload: ValidatedImportPayload): void {
  if (payload.tasks.length > 0) {
    localStorage.setItem('pcc_tasks', JSON.stringify(payload.tasks));
  }
  if (payload.projects.length > 0) {
    localStorage.setItem('pcc_projects', JSON.stringify(payload.projects));
  }
  if (payload.notes.length > 0) {
    localStorage.setItem('pcc_notes', JSON.stringify(payload.notes));
  }
  if (payload.ideas.length > 0) {
    localStorage.setItem('pcc_ideas', JSON.stringify(payload.ideas));
  }
  if (payload.calendarEvents.length > 0) {
    localStorage.setItem('pcc_calendar_events', JSON.stringify(payload.calendarEvents));
  }
  if (payload.reminders.length > 0) {
    localStorage.setItem('pcc_reminders', JSON.stringify(payload.reminders));
  }
  if (payload.alarms.length > 0) {
    localStorage.setItem('pcc_alarms', JSON.stringify(payload.alarms));
  }
  if (payload.integrations && payload.integrations.length > 0) {
    localStorage.setItem('pcc_integrations_store_v2', JSON.stringify(payload.integrations));
  }
  if (payload.goals.length > 0) {
    localStorage.setItem('pcc_goals', JSON.stringify(payload.goals));
  }
  if (payload.contacts.length > 0) {
    localStorage.setItem('pcc_contacts', JSON.stringify(payload.contacts));
  }
  if (payload.weather?.selectedCity) {
    localStorage.setItem('pcc_weather_selected_city', payload.weather.selectedCity);
    localStorage.setItem('pcc_weather_unit', payload.weather.unit);
  }
  if (payload.user) {
    localStorage.setItem('pcc_user_profile', JSON.stringify(payload.user));
    localStorage.setItem('pcc_user_data', JSON.stringify(payload));
  }

  // Dispatch custom event to inform components/listeners of data reload
  window.dispatchEvent(new Event('pcc-data-imported'));
}

function createEmptyStats(): ImportStats {
  return {
    user: 0,
    tasks: 0,
    projects: 0,
    notes: 0,
    ideas: 0,
    calendarEvents: 0,
    goals: 0,
    contacts: 0,
    reminders: 0,
    alarms: 0,
    integrations: 0,
    weather: 0,
    totalImported: 0,
  };
}

function createEmptyPayload(): ValidatedImportPayload {
  return {
    tasks: [],
    projects: [],
    notes: [],
    ideas: [],
    calendarEvents: [],
    goals: [],
    contacts: [],
    reminders: [],
    alarms: [],
    integrations: [],
  };
}
