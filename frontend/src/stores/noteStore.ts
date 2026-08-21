import { create } from 'zustand';
import { Note, NoteChecklistItem } from '../types';
import { notesApi } from '../services/api';
import { generateId } from '../utils';

interface NoteStore {
  notes: Note[];
  activeNoteId: string | null;
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
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
  setNoteColor: (id: string, color: string) => Promise<void>;
  addChecklistItem: (noteId: string, text?: string) => Promise<void>;
  toggleChecklistItem: (noteId: string, itemId: string) => Promise<void>;
  updateChecklistItem: (noteId: string, itemId: string, text: string) => Promise<void>;
  deleteChecklistItem: (noteId: string, itemId: string) => Promise<void>;
  reorderChecklistItems: (noteId: string, items: NoteChecklistItem[]) => Promise<void>;
  setActiveNoteId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSaving: (saving: boolean) => void;
  getActiveNote: () => Note | undefined;
}

const STORAGE_KEY_V1 = 'pcc_notes_store_v1';
const STORAGE_KEY_LEGACY = 'pcc_notes';

const loadStoredNotes = (): Note[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1) || localStorage.getItem(STORAGE_KEY_LEGACY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        const isLegacyMock = parsed.some(
          (n: any) =>
            n.title?.includes('PCC Architecture') ||
            n.title?.includes('Daily Deep Work Routine') ||
            n.title?.includes('FastAPI Backend Endpoints') ||
            n.title?.includes('Q3 Reading List')
        );
        if (isLegacyMock) {
          localStorage.removeItem(STORAGE_KEY_V1);
          localStorage.removeItem(STORAGE_KEY_LEGACY);
          return [];
        }
        return parsed.map((n) => ({
          ...n,
          type: n.type || 'text',
          color: n.color || 'default',
          archived: !!n.archived,
          trashed: !!n.trashed,
          checklistItems: n.checklistItems || [],
        }));
      }
    }
  } catch (err) {
    console.warn('Failed to parse notes from localStorage', err);
  }
  return [];
};

const saveNotes = (notes: Note[]) => {
  try {
    const data = JSON.stringify(notes);
    localStorage.setItem(STORAGE_KEY_V1, data);
    localStorage.setItem(STORAGE_KEY_LEGACY, data);
  } catch (err) {
    console.warn('Failed to save notes to localStorage', err);
  }
};

export const useNoteStore = create<NoteStore>((set, get) => ({
  notes: loadStoredNotes(),
  activeNoteId: null,
  searchQuery: '',
  isSaving: false,
  isLoading: false,
  error: null,

  fetchNotes: async () => {
    set({ isLoading: true, error: null });
    try {
      const serverNotes = await notesApi.getAll();
      if (serverNotes && Array.isArray(serverNotes)) {
        const processed = serverNotes.map((n: Note) => ({
          ...n,
          type: n.type || 'text',
          color: n.color || 'default',
          archived: !!n.archived,
          trashed: !!n.trashed,
          checklistItems: n.checklistItems || [],
        }));
        set({ notes: processed, isLoading: false });
        saveNotes(processed);
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
      category: initial?.category || 'General',
      pinned: initial?.pinned || false,
      tags: initial?.tags || [],
      type: initial?.type || 'text',
      checklistItems: initial?.checklistItems || [],
      color: initial?.color || 'default',
      archived: initial?.archived || false,
      trashed: initial?.trashed || false,
      createdAt: now,
      updatedAt: now,
    };

    set((state) => {
      const updated = [newNote, ...state.notes];
      saveNotes(updated);
      return { notes: updated, activeNoteId: newNote.id };
    });

    try {
      const created = await notesApi.create(newNote);
      if (created && created.id) {
        set((state) => {
          const updated = state.notes.map((n) => (n.id === newNote.id ? { ...created } : n));
          saveNotes(updated);
          return { notes: updated, activeNoteId: created.id };
        });
        return created;
      }
    } catch {
      // Optimistic fallback: newNote is already prepended to local state
    }

    return newNote;
  },

  updateNote: async (id, updates) => {
    const now = new Date().toISOString();
    set((state) => {
      const updated = state.notes.map((n) =>
        n.id === id ? { ...n, ...updates, updatedAt: now } : n
      );
      saveNotes(updated);
      return { notes: updated, isSaving: false };
    });

    try {
      await notesApi.update(id, updates);
    } catch {
      // Optimistic fallback
    }
  },

  deleteNote: async (id) => {
    set((state) => {
      const updated = state.notes.filter((n) => n.id !== id);
      saveNotes(updated);
      const nextActive = state.activeNoteId === id ? null : state.activeNoteId;
      return { notes: updated, activeNoteId: nextActive };
    });

    try {
      await notesApi.delete(id);
    } catch {
      // Optimistic fallback
    }
  },

  togglePinNote: async (id) => {
    const note = get().notes.find((n) => n.id === id);
    if (!note) return;
    await get().updateNote(id, { pinned: !note.pinned });
  },

  trashNote: async (id) => {
    await get().updateNote(id, { trashed: true, archived: false, pinned: false });
  },

  restoreNote: async (id) => {
    await get().updateNote(id, { trashed: false });
  },

  emptyTrash: async () => {
    const trashedIds = get().notes.filter((n) => n.trashed).map((n) => n.id);
    set((state) => {
      const updated = state.notes.filter((n) => !n.trashed);
      saveNotes(updated);
      const nextActive = trashedIds.includes(state.activeNoteId || '') ? null : state.activeNoteId;
      return { notes: updated, activeNoteId: nextActive };
    });

    for (const id of trashedIds) {
      try {
        await notesApi.delete(id);
      } catch {
        // Ignore individual delete failure
      }
    }
  },

  setNoteColor: async (id, color) => {
    await get().updateNote(id, { color });
  },

  addChecklistItem: async (noteId, text = '') => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note) return;
    const newItem: NoteChecklistItem = {
      id: generateId('chk'),
      text,
      completed: false,
    };
    const items = [...(note.checklistItems || []), newItem];
    await get().updateNote(noteId, { checklistItems: items, type: 'checklist' });
  },

  toggleChecklistItem: async (noteId, itemId) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note || !note.checklistItems) return;
    const items = note.checklistItems.map((item) =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    await get().updateNote(noteId, { checklistItems: items });
  },

  updateChecklistItem: async (noteId, itemId, text) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note || !note.checklistItems) return;
    const items = note.checklistItems.map((item) =>
      item.id === itemId ? { ...item, text } : item
    );
    await get().updateNote(noteId, { checklistItems: items });
  },

  deleteChecklistItem: async (noteId, itemId) => {
    const note = get().notes.find((n) => n.id === noteId);
    if (!note || !note.checklistItems) return;
    const items = note.checklistItems.filter((item) => item.id !== itemId);
    await get().updateNote(noteId, { checklistItems: items });
  },

  reorderChecklistItems: async (noteId, items) => {
    await get().updateNote(noteId, { checklistItems: items });
  },

  setActiveNoteId: (id) => set({ activeNoteId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setSaving: (isSaving) => set({ isSaving }),
  getActiveNote: () => {
    const { notes, activeNoteId } = get();
    return notes.find((n) => n.id === activeNoteId);
  },
}));
