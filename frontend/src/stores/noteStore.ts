import { create } from 'zustand';
import { Note } from '../types';
import { notesApi } from '../services/api';
import { generateId } from '../utils';

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
  selectedCategory: string;
  searchQuery: string;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchNotes: () => Promise<void>;
  addNote: (initial?: Partial<Note>) => Promise<Note>;
  updateNote: (id: string, updates: Partial<Note>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePinNote: (id: string) => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
  setSelectedCategory: (cat: string) => void;
  setSearchQuery: (query: string) => void;
  setSaving: (saving: boolean) => void;
  getActiveNote: () => Note | undefined;
}

const INITIAL_NOTES: Note[] = [
  {
    id: 'note-01',
    title: 'PCC Architecture & System Design Philosophy',
    content: `# PCC System Architecture

The **Personal Control Center** is built as an ultra-responsive, offline-first personal operating cockpit.

### Core Tenets
1. **Single Pane of Glass**: Unified access to projects, tasks, calendar time blocks, and knowledge assets.
2. **Instant Interaction**: Zero latency UI with optimistic client caching.
3. **Design Excellence**: Deep dark theme with indigo/violet accents and WCAG AA accessibility.

### Component Structure
- \`Projects\`: High-level initiatives and milestones
- \`Kanban Board\`: Column-based workflow progression
- \`Notes\`: Bi-directional markdown repository
- \`Calendar\`: Time-blocked schedule and deadline synchronization

> "Simplicity is prerequisite for reliability." - Edsger W. Dijkstra
`,
    category: 'Engineering',
    pinned: true,
    tags: ['Architecture', 'PCC', 'React'],
    createdAt: '2026-08-10T10:00:00Z',
    updatedAt: '2026-08-15T09:30:00Z',
  },
  {
    id: 'note-02',
    title: 'Daily Deep Work Routine & Energy Management',
    content: `# Peak Performance Daily Protocol

### Morning Focus Block (08:30 - 11:30)
- [x] Review highest-leverage task for the day
- [x] Silence all notifications and background chats
- [ ] Complete 2x 90-minute uninterrupted deep work blocks
- [ ] Log output deliverables in PCC

### Afternoon Collaboration & Synthesis (14:00 - 17:00)
- Code reviews, team syncs, and architecture reviews
- Triage inbox and backlog items
- Review calendar schedule for tomorrow
`,
    category: 'Personal',
    pinned: true,
    tags: ['Productivity', 'Habits'],
    createdAt: '2026-08-12T07:00:00Z',
    updatedAt: '2026-08-15T08:00:00Z',
  },
  {
    id: 'note-03',
    title: 'FastAPI Backend Endpoints & PostgreSQL Schema Spec',
    content: `# REST API & DB Schema Reference

### Main Resources
- \`GET /api/v1/projects\`: Returns active projects with task statistics
- \`POST /api/v1/tasks\`: Creates task with priority and project linkage
- \`GET /api/v1/notes\`: Markdown knowledge base notes
- \`GET /api/v1/calendar\`: Unified events and schedule items

\`\`\`sql
CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active',
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
\`\`\`
`,
    category: 'Engineering',
    pinned: false,
    tags: ['FastAPI', 'Backend', 'SQL'],
    createdAt: '2026-08-13T14:15:00Z',
    updatedAt: '2026-08-14T16:45:00Z',
  },
  {
    id: 'note-04',
    title: 'Q3 Reading List & Executive Summary Notes',
    content: `# Q3 Curated Reading List

### Books in Progress
1. *Designing Data-Intensive Applications* by Martin Kleppmann
2. *Staff Engineer: Leadership Beyond the Management Track* by Will Larson
3. *Outlive: The Science and Art of Longevity* by Dr. Peter Attia

### Key Takeaways
- Resilient distributed consensus requires understanding partition boundaries.
- Strategic technical leadership is about amplifying team leverage and removing friction.
`,
    category: 'Knowledge',
    pinned: false,
    tags: ['Books', 'Learning'],
    createdAt: '2026-08-05T19:00:00Z',
    updatedAt: '2026-08-11T21:00:00Z',
  },
];

const STORAGE_KEY = 'pcc_notes_store_v1';

const loadStoredNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Failed to parse notes from localStorage', err);
  }
  return INITIAL_NOTES;
};

const saveNotes = (notes: Note[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (err) {
    console.warn('Failed to save notes to localStorage', err);
  }
};

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: loadStoredNotes(),
  activeNoteId: INITIAL_NOTES[0].id,
  selectedCategory: 'All',
  searchQuery: '',
  isSaving: false,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverNotes = await notesApi.getAll();
      if (serverNotes && Array.isArray(serverNotes) && serverNotes.length > 0) {
        set({ notes: serverNotes, isLoading: false });
        saveNotes(serverNotes);
        return;
      }
    } catch {
      // Fallback
    }
    set({ isLoading: false });
  },

  addNote: async (initial) => {
    const now = new Date().toISOString();
    const newNote: Note = {
      id: generateId('note'),
      title: initial?.title !== undefined ? initial.title : '',
      content: initial?.content !== undefined ? initial.content : '',
      category: initial?.category || (get().selectedCategory !== 'All' ? get().selectedCategory : 'General'),
      pinned: initial?.pinned || false,
      tags: initial?.tags || [],
      createdAt: now,
      updatedAt: now,
    };

    try {
      const created = await notesApi.create(newNote);
      if (created && created.id) {
        set((state) => {
          const updated = [created, ...state.notes];
          saveNotes(updated);
          return { notes: updated, activeNoteId: created.id };
        });
        return created;
      }
    } catch {
      // Fallback
    }

    set((state) => {
      const updated = [newNote, ...state.notes];
      saveNotes(updated);
      return { notes: updated, activeNoteId: newNote.id };
    });
    return newNote;
  },

  updateNote: async (id, updates) => {
    const now = new Date().toISOString();
    set({ isSaving: true });

    try {
      await notesApi.update(id, updates);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: now } : n
      );
      saveNotes(updated);
      return { notes: updated, isSaving: false };
    });
  },

  deleteNote: async (id) => {
    try {
      await notesApi.delete(id);
    } catch {
      // Ignore API offline error
    }

    set((state) => {
      const updated = state.notes.filter((n) => n.id !== id);
      saveNotes(updated);
      const nextActive = state.activeNoteId === id
        ? (updated.length > 0 ? updated[0].id : null)
        : state.activeNoteId;
      return { notes: updated, activeNoteId: nextActive };
    });
  },

  togglePinNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().updateNote(id, { pinned: !note.pinned });
  },

  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSaving: (isSaving) => set({ isSaving }),
  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId) || (notes.length > 0 ? notes[0] : undefined);
  },
}));
