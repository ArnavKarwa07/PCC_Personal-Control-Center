import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '../stores/uiStore';
import { useTaskStore } from '../stores/taskStore';
import { useProjectStore } from '../stores/projectStore';
import { useNoteStore } from '../stores/noteStore';
import { useIdeaStore } from '../stores/ideaStore';
import { useCalendarStore } from '../stores/calendarStore';
import { useToast } from '../hooks/useToast';
import { Badge } from './ui/Badge';
import { cn } from '../utils';
import { soundEffects } from '../utils/audio';
import './CommandPalette.css';

interface CommandItem {
  id: string;
  category: 'Actions' | 'Navigation' | 'Tasks' | 'Projects' | 'Notes' | 'Ideas' | 'Calendar Events';
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: { label: string; variant?: 'default' | 'accent' | 'success' | 'warning' | 'error' };
  action: () => void;
}

export const CommandPalette: React.FC = () => {
  const { commandPaletteOpen, setCommandPaletteOpen, theme, setTheme } = useUIStore();
  const { tasks } = useTaskStore();
  const { projects } = useProjectStore();
  const { notes } = useNoteStore();
  const { ideas } = useIdeaStore();
  const { events } = useCalendarStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Generate complete command list
  const allCommands = useMemo<CommandItem[]>(() => {
    const items: CommandItem[] = [];

    // 1. Quick Actions
    items.push(
      {
        id: 'act-new-task',
        category: 'Actions',
        title: 'Create New Task',
        subtitle: 'Add to backlog or kanban board',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        ),
        action: () => {
          navigate('/tasks');
          toast.info('Opening task creator on Tasks page');
        },
      },
      {
        id: 'act-new-project',
        category: 'Actions',
        title: 'Create New Project',
        subtitle: 'Initiate a new project workspace',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
        action: () => {
          navigate('/projects');
          toast.info('Opening project creator on Projects page');
        },
      },
      {
        id: 'act-new-note',
        category: 'Actions',
        title: 'New Knowledge Note',
        subtitle: 'Open Markdown notes editor',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
        action: () => {
          navigate('/notes');
        },
      },
      {
        id: 'act-add-reminder',
        category: 'Actions',
        title: 'Add Scheduled Reminder',
        subtitle: 'Time-based reminder alert',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        ),
        action: () => {
          navigate('/reminders');
        },
      },
      {
        id: 'act-set-alarm',
        category: 'Actions',
        title: 'Set Wakeup / Routine Alarm',
        subtitle: 'Configure smart waking schedules',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="13" r="8" />
            <path d="M12 9v4l2 2" />
            <path d="M5 3L2 6" />
            <path d="M22 6l-3-3" />
          </svg>
        ),
        action: () => {
          navigate('/alarms');
        },
      },
      {
        id: 'act-start-timer',
        category: 'Actions',
        title: 'Start 25m Focus Pomodoro',
        subtitle: 'Deep work interval timer',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        ),
        action: () => {
          navigate('/timers');
        },
      },
      {
        id: 'act-toggle-theme',
        category: 'Actions',
        title: theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme',
        subtitle: 'Change interface color theme',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
          </svg>
        ),
        action: () => {
          setTheme(theme === 'dark' ? 'light' : 'dark');
          toast.success(`Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`);
        },
      }
    );

    // 2. Navigation
    const navRoutes = [
      { name: 'Dashboard', path: '/' },
      { name: 'Tasks & Kanban', path: '/tasks' },
      { name: 'Projects & Roadmaps', path: '/projects' },
      { name: 'Calendar Schedule', path: '/calendar' },
      { name: 'Reminders & Alerts', path: '/reminders' },
      { name: 'Alarms & Schedules', path: '/alarms' },
      { name: 'Focus Timers & Pomodoro', path: '/timers' },
      { name: 'Weather & Environment', path: '/weather' },
      { name: 'Notes', path: '/notes' },
      { name: 'Idea Capture & Brainstorming', path: '/ideas' },
      { name: 'Goals & OKR Tracking', path: '/goals' },
      { name: 'Notifications Center', path: '/notifications' },
      { name: 'System Settings & Integrations', path: '/settings' },
    ];

    navRoutes.forEach((route) => {
      items.push({
        id: `nav-${route.path}`,
        category: 'Navigation',
        title: `Go to ${route.name}`,
        subtitle: route.path,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        ),
        action: () => navigate(route.path),
      });
    });

    // 3. Tasks
    tasks.forEach((t) => {
      items.push({
        id: `task-${t.id}`,
        category: 'Tasks',
        title: t.title,
        subtitle: `${t.projectName || 'General'} • Due ${t.dueDate || 'No date'}`,
        badge: {
          label: t.priority,
          variant: t.priority === 'urgent' ? 'error' : t.priority === 'high' ? 'warning' : 'accent',
        },
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
        ),
        action: () => navigate(`/tasks/${t.id}`),
      });
    });

    // 4. Projects
    projects.forEach((p) => {
      items.push({
        id: `proj-${p.id}`,
        category: 'Projects',
        title: p.title,
        subtitle: `${p.status} • ${p.category || 'Engineering'}`,
        badge: {
          label: `${p.progress || 0}%`,
          variant: 'accent',
        },
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </svg>
        ),
        action: () => navigate(`/projects/${p.id}`),
      });
    });

    // 5. Notes
    notes.forEach((n) => {
      items.push({
        id: `note-${n.id}`,
        category: 'Notes',
        title: n.title,
        subtitle: n.category || 'General Note',
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
        action: () => navigate('/notes'),
      });
    });

    // 6. Ideas
    ideas.forEach((idea) => {
      items.push({
        id: `idea-${idea.id}`,
        category: 'Ideas',
        title: idea.title,
        subtitle: `Status: ${idea.status} • ${idea.category || 'Concept'}`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 18h6" />
            <path d="M10 22h4" />
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
          </svg>
        ),
        action: () => navigate('/ideas'),
      });
    });

    // 7. Calendar Events
    events.forEach((ev) => {
      items.push({
        id: `event-${ev.id}`,
        category: 'Calendar Events',
        title: ev.title,
        subtitle: `${ev.type} • ${ev.startDate.replace('T', ' ')}`,
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
          </svg>
        ),
        action: () => navigate('/calendar'),
      });
    });

    return items;
  }, [tasks, projects, notes, ideas, events, navigate, theme, setTheme, toast]);

  // Filter commands by query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      return allCommands.slice(0, 20); // Top suggestions
    }
    const q = query.toLowerCase();
    return allCommands.filter((cmd) => {
      const matchTitle = cmd.title.toLowerCase().includes(q);
      const matchSubtitle = cmd.subtitle?.toLowerCase().includes(q);
      const matchCategory = cmd.category.toLowerCase().includes(q);
      return matchTitle || matchSubtitle || matchCategory;
    });
  }, [allCommands, query]);

  // Group filtered results by category
  const groupedCategories = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filteredCommands.forEach((cmd) => {
      const list = map.get(cmd.category) || [];
      list.push(cmd);
      map.set(cmd.category, list);
    });
    return Array.from(map.entries()).map(([category, items]) => ({
      category,
      items,
    }));
  }, [filteredCommands]);

  // Keep selected index in range
  useEffect(() => {
    if (selectedIndex >= filteredCommands.length) {
      setSelectedIndex(Math.max(0, filteredCommands.length - 1));
    }
  }, [filteredCommands.length, selectedIndex]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        soundEffects.playPip();
        filteredCommands[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setCommandPaletteOpen(false);
    }
  };

  if (!commandPaletteOpen) return null;

  let flatIndexCounter = 0;

  return createPortal(
    <div
      className="pcc-command-dialog-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          setCommandPaletteOpen(false);
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div className="pcc-command-dialog">
        {/* Search Header */}
        <div className="pcc-command-dialog__header">
          <svg
            className="pcc-command-dialog__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            id="command-palette-input"
            className="pcc-command-dialog__input"
            placeholder="Type a command or search tasks, projects, notes, alarms..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            autoFocus
          />

          <span className="pcc-command-dialog__esc-badge">ESC</span>
        </div>

        {/* Results List */}
        <div ref={listRef} className="pcc-command-dialog__body">
          {filteredCommands.length === 0 ? (
            <div className="pcc-command-dialog__empty">
              <div className="pcc-command-dialog__empty-title">No matching results found</div>
              <p>Try searching for tasks, projects, notes, reminders, or system commands.</p>
            </div>
          ) : (
            groupedCategories.map((group) => (
              <div key={group.category} className="pcc-command-category">
                <div className="pcc-command-category__title">{group.category}</div>
                {group.items.map((cmd) => {
                  const currentIndex = flatIndexCounter++;
                  const isSelected = currentIndex === selectedIndex;

                  return (
                    <div
                      key={cmd.id}
                      id={`cmd-item-${cmd.id}`}
                      className={cn('pcc-command-item', isSelected && 'pcc-command-item--active')}
                      onClick={() => {
                        soundEffects.playPip();
                        cmd.action();
                        setCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="pcc-command-item__left">
                        <div className="pcc-command-item__icon">{cmd.icon}</div>
                        <span className="pcc-command-item__title">{cmd.title}</span>
                        {cmd.subtitle && (
                          <span className="pcc-command-item__subtitle">{cmd.subtitle}</span>
                        )}
                      </div>

                      <div className="pcc-command-item__right">
                        {cmd.badge && (
                          <Badge variant={cmd.badge.variant || 'default'} size="sm">
                            {cmd.badge.label}
                          </Badge>
                        )}
                        {isSelected && (
                          <span className="pcc-command-item__action-hint">
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }}>
                              <polyline points="9 10 4 15 9 20" />
                              <path d="M20 4v7a4 4 0 0 1-4 4H4" />
                            </svg>
                            Select
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="pcc-command-dialog__footer">
          <div className="pcc-command-dialog__shortcuts">
            <span className="pcc-command-dialog__shortcut-item">
              <kbd>↑</kbd> <kbd>↓</kbd> Navigate
            </span>
            <span className="pcc-command-dialog__shortcut-item">
              <kbd>Enter</kbd> Select
            </span>
            <span className="pcc-command-dialog__shortcut-item">
              <kbd>ESC</kbd> Close
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <img src="/logo.png" alt="PCC Logo" style={{ width: 14, height: 14, borderRadius: 3, objectFit: 'contain' }} />
            <span>PCC Command System v1.0</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
