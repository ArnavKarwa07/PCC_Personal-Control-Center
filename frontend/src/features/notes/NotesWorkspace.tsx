import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useToast } from '../../hooks/useToast';
import { Note, NoteChecklistItem } from '../../types';
import { Button, Input, EmptyState } from '../../components/ui';
import { MarkdownPreview } from './MarkdownPreview';
import { formatDate, cn, generateId } from '../../utils';
import './Notes.css';

const COLOR_OPTIONS = [
  { id: 'default', name: 'Default', hex: '#6366f1' },
  { id: 'lavender', name: 'Lavender', hex: '#8b5cf6' },
  { id: 'emerald', name: 'Emerald', hex: '#10b981' },
  { id: 'amber', name: 'Amber', hex: '#f59e0b' },
  { id: 'rose', name: 'Rose', hex: '#f43f5e' },
  { id: 'sky', name: 'Sky', hex: '#0ea5e9' },
];

export const NotesWorkspace: React.FC = () => {
  const {
    notes,
    activeNoteId,
    searchQuery,
    isSaving,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    trashNote,
    restoreNote,
    emptyTrash,
    setNoteColor,
    setActiveNoteId,
    setSearchQuery,
    getActiveNote,
  } = useNoteStore();

  const { addToast } = useToast();
  const activeNote = getActiveNote();

  // Tab & Gallery State
  const [filterTab, setFilterTab] = useState<'all' | 'pinned' | 'checklists' | 'trash'>('all');
  const [galleryView, setGalleryView] = useState<'grid' | 'list'>('grid');

  // Quick Note Bar State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickContent, setQuickContent] = useState('');
  const [isQuickExpanded, setIsQuickExpanded] = useState(false);
  const quickBarRef = useRef<HTMLDivElement>(null);

  // Editor Modal Draft State
  const [localTitle, setLocalTitle] = useState('');
  const [localContent, setLocalContent] = useState('');
  const [localType, setLocalType] = useState<'text' | 'checklist'>('text');
  const [localColor, setLocalColor] = useState('default');
  const [localChecklistItems, setLocalChecklistItems] = useState<NoteChecklistItem[]>([]);
  const [textEditorMode, setTextEditorMode] = useState<'edit' | 'split' | 'preview'>('edit');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Checklist input refs for auto-focusing next row on Enter / Backspace key
  const checklistRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const focusTargetIdRef = useRef<string | null>(null);

  // Auto-focus target checklist item
  useEffect(() => {
    if (focusTargetIdRef.current && checklistRefs.current[focusTargetIdRef.current]) {
      checklistRefs.current[focusTargetIdRef.current]?.focus();
      focusTargetIdRef.current = null;
    }
  }, [localChecklistItems]);

  // Click outside listener for quick input bar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (quickBarRef.current && !quickBarRef.current.contains(e.target as Node)) {
        if (!quickTitle.trim() && !quickContent.trim()) {
          setIsQuickExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [quickTitle, quickContent]);

  // Track activeNoteId to avoid race-condition overwriting while typing
  const prevActiveNoteIdRef = useRef<string | null>(null);

  // Debounced auto-save refs
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingUpdatesRef = useRef<Partial<Note>>({});

  const flushPendingAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    if (activeNote && Object.keys(pendingUpdatesRef.current).length > 0) {
      updateNote(activeNote.id, pendingUpdatesRef.current);
      pendingUpdatesRef.current = {};
      setSaveStatus('saved');
    }
  }, [activeNote, updateNote]);

  const closeModal = useCallback(() => {
    flushPendingAutoSave();
    setActiveNoteId(null);
  }, [flushPendingAutoSave, setActiveNoteId]);

  // Sync active note state ONLY when activeNoteId changes (opened or switched)
  useEffect(() => {
    if (activeNoteId !== prevActiveNoteIdRef.current) {
      prevActiveNoteIdRef.current = activeNoteId;
      if (activeNote) {
        setLocalTitle(activeNote.title || '');
        setLocalContent(activeNote.content || '');
        setLocalType(activeNote.type || 'text');
        setLocalColor(activeNote.color || 'default');
        setLocalChecklistItems(activeNote.checklistItems || []);
        setSaveStatus('saved');
        pendingUpdatesRef.current = {};
      }
    }
  }, [activeNoteId, activeNote]);

  // Body Scroll-lock and Escape Key Navigation for Modal Overlay
  useEffect(() => {
    if (activeNote) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          closeModal();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [activeNote, closeModal]);

  const triggerAutoSave = useCallback(
    (updates: Partial<Note>) => {
      if (!activeNote) return;
      setSaveStatus('saving');
      pendingUpdatesRef.current = { ...pendingUpdatesRef.current, ...updates };

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(async () => {
        if (activeNote && Object.keys(pendingUpdatesRef.current).length > 0) {
          await updateNote(activeNote.id, pendingUpdatesRef.current);
          pendingUpdatesRef.current = {};
        }
        setSaveStatus('saved');
      }, 500);
    },
    [activeNote, updateNote]
  );

  // Auto-save handlers for modal inputs
  const handleTitleChange = (val: string) => {
    setLocalTitle(val);
    triggerAutoSave({ title: val });
  };

  const handleContentChange = (val: string) => {
    setLocalContent(val);
    triggerAutoSave({ content: val });
  };

  const handleColorChange = (color: string) => {
    setLocalColor(color);
    setNoteColor(activeNote?.id || '', color);
    triggerAutoSave({ color });
  };

  const handleTypeToggle = (targetType: 'text' | 'checklist') => {
    if (targetType === localType) return;
    setLocalType(targetType);

    if (targetType === 'checklist') {
      if (localChecklistItems.length === 0) {
        const lines = localContent
          .split('\n')
          .map((l) => l.replace(/^[-*]\s*(\[[ xX]\])?\s*/, '').trim())
          .filter(Boolean);
        const newItems: NoteChecklistItem[] =
          lines.length > 0
            ? lines.map((text) => ({ id: generateId('chk'), text, completed: false }))
            : [{ id: generateId('chk'), text: '', completed: false }];
        setLocalChecklistItems(newItems);
        triggerAutoSave({ type: 'checklist', checklistItems: newItems });
      } else {
        triggerAutoSave({ type: 'checklist' });
      }
    } else {
      if (!localContent.trim() && localChecklistItems.length > 0) {
        const converted = localChecklistItems
          .map((item) => `- [${item.completed ? 'x' : ' '}] ${item.text}`)
          .join('\n');
        setLocalContent(converted);
        triggerAutoSave({ type: 'text', content: converted });
      } else {
        triggerAutoSave({ type: 'text' });
      }
    }
  };

  // Checklist Item Helpers
  const handleChecklistItemTextChange = (id: string, text: string) => {
    const updated = localChecklistItems.map((item) => (item.id === id ? { ...item, text } : item));
    setLocalChecklistItems(updated);
    triggerAutoSave({ checklistItems: updated });
  };

  const handleChecklistItemToggle = (id: string) => {
    const updated = localChecklistItems.map((item) =>
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    setLocalChecklistItems(updated);
    triggerAutoSave({ checklistItems: updated });
  };

  const handleAddChecklistItemAfter = (index: number) => {
    const newItem: NoteChecklistItem = { id: generateId('chk'), text: '', completed: false };
    const updated = [...localChecklistItems];
    updated.splice(index + 1, 0, newItem);
    focusTargetIdRef.current = newItem.id;
    setLocalChecklistItems(updated);
    triggerAutoSave({ checklistItems: updated });
  };

  const handleDeleteChecklistItem = (id: string, index?: number) => {
    const updated = localChecklistItems.filter((item) => item.id !== id);
    if (index !== undefined && index > 0 && localChecklistItems[index - 1]) {
      focusTargetIdRef.current = localChecklistItems[index - 1].id;
    }
    setLocalChecklistItems(updated);
    triggerAutoSave({ checklistItems: updated });
  };

  // Quick Note creation action
  const handleQuickCreate = async (type: 'text' | 'checklist' = 'text') => {
    const titleToUse = quickTitle.trim();
    const contentToUse = quickContent.trim();

    const initialItems: NoteChecklistItem[] =
      type === 'checklist' ? [{ id: generateId('chk'), text: contentToUse || '', completed: false }] : [];

    const newNote = await addNote({
      title: titleToUse,
      content: type === 'text' ? contentToUse : '',
      type,
      checklistItems: initialItems,
    });

    if (newNote && newNote.id) {
      setActiveNoteId(newNote.id);
    }

    setQuickTitle('');
    setQuickContent('');
    setIsQuickExpanded(false);

    addToast({
      type: 'success',
      title: type === 'checklist' ? 'Checklist Created' : 'Note Created',
      message: 'New note created.',
      duration: 2000,
    });
  };

  // Duplicate active note
  const handleDuplicateNote = async () => {
    if (!activeNote) return;
    const duplicated = await addNote({
      title: `${activeNote.title} (Copy)`,
      content: activeNote.content,
      type: activeNote.type,
      color: activeNote.color,
      pinned: activeNote.pinned,
      checklistItems: activeNote.checklistItems
        ? activeNote.checklistItems.map((item) => ({ ...item, id: generateId('chk') }))
        : [],
      tags: activeNote.tags ? [...activeNote.tags] : [],
    });
    addToast({
      type: 'success',
      title: 'Note Duplicated',
      message: `Created duplicate "${duplicated.title}".`,
      duration: 2000,
    });
  };

  // Export note TXT / MD with OS-safe filename
  const handleExportNote = () => {
    if (!activeNote) return;
    let exportText = activeNote.title ? `# ${activeNote.title}\n\n` : '';
    if (activeNote.type === 'checklist' && activeNote.checklistItems) {
      exportText += activeNote.checklistItems
        .map((item) => `- [${item.completed ? 'x' : ' '}] ${item.text}`)
        .join('\n');
    } else {
      exportText += activeNote.content || '';
    }

    const safeFilename = (activeNote.title || 'note')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9_-]/gi, '_')
      .replace(/_+/g, '_');

    const blob = new Blob([exportText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeFilename}.md`;
    link.click();
    URL.revokeObjectURL(url);

    addToast({
      type: 'info',
      title: 'Note Exported',
      message: 'Downloaded Markdown file.',
      duration: 2000,
    });
  };

  // Filtering Notes logic
  const filteredNotes = notes.filter((n) => {
    if (filterTab === 'trash') {
      if (!n.trashed) return false;
    } else {
      if (n.trashed) return false;
      if (filterTab === 'pinned' && !n.pinned) return false;
      if (filterTab === 'checklists' && n.type !== 'checklist') return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = n.title.toLowerCase().includes(q);
      const contentMatch = n.content.toLowerCase().includes(q);
      const checklistMatch = n.checklistItems?.some((item) => item.text.toLowerCase().includes(q));
      return titleMatch || contentMatch || checklistMatch;
    }

    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  // Word / item metrics for active editor
  const completedChecklistCount = localChecklistItems.filter((i) => i.completed).length;
  const totalChecklistCount = localChecklistItems.length;
  const checklistPercent =
    totalChecklistCount > 0 ? Math.round((completedChecklistCount / totalChecklistCount) * 100) : 0;
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;

  return (
    <div className="pcc-notes-redesign-root" id="notes-workspace-root">
      <header className="pcc-notes-header">
        <h1>Notes</h1>
      </header>

      {/* 1. Quick Note Input Bar */}
      {filterTab !== 'trash' && (
        <div className="pcc-notes-quick-bar-wrapper">
          <div
            ref={quickBarRef}
            className={cn('pcc-notes-quick-bar', isQuickExpanded && 'pcc-notes-quick-bar--expanded')}
          >
            {isQuickExpanded && (
              <input
                className="pcc-notes-quick-bar__title-input"
                placeholder="Title"
                aria-label="Quick note title input"
                value={quickTitle}
                onChange={(e) => setQuickTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickCreate('text');
                }}
              />
            )}

            <div className="pcc-notes-quick-bar__main-row">
              <input
                className="pcc-notes-quick-bar__input"
                placeholder={isQuickExpanded ? 'Take a note...' : 'Take a note...'}
                aria-label="Take a note quick input"
                value={quickContent}
                onFocus={() => setIsQuickExpanded(true)}
                onChange={(e) => setQuickContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && quickContent.trim()) {
                    e.preventDefault();
                    handleQuickCreate('text');
                  }
                }}
              />

              <div className="pcc-notes-quick-bar__actions">
                <Button
                  variant="ghost"
                  size="sm"
                  title="New Text Note"
                  aria-label="Create new text note"
                  onClick={() => handleQuickCreate('text')}
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  }
                >
                  <span className="pcc-notes-quick-btn-label">+ Note</span>
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  title="New Checklist"
                  aria-label="Create new checklist note"
                  onClick={() => handleQuickCreate('checklist')}
                  icon={
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  }
                >
                  <span className="pcc-notes-quick-btn-label">+ Checklist</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Controls & Search & Navigation Bar */}
      <div className="pcc-notes-controls-container">
        <div className="pcc-notes-search-row">
          <Input
            id="notes-search-input"
            placeholder="Search title, content or checklist items..."
            aria-label="Search title, content or checklist items"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />

          {/* View Switcher Toggle */}
          <div className="pcc-notes-view-switcher">
            <button
              type="button"
              className={cn('pcc-notes-view-btn', galleryView === 'grid' && 'pcc-notes-view-btn--active')}
              onClick={() => setGalleryView('grid')}
              title="Grid View"
              aria-label="Switch to grid gallery view"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              Grid
            </button>
            <button
              type="button"
              className={cn('pcc-notes-view-btn', galleryView === 'list' && 'pcc-notes-view-btn--active')}
              onClick={() => setGalleryView('list')}
              title="List View"
              aria-label="Switch to list gallery view"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              List
            </button>
          </div>
        </div>

        {/* Filter Tabs (Desktop) */}
        <div className="pcc-notes-filter-tabs" role="tablist" aria-label="Notes filter tabs">
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'all'}
            aria-label="Show all active notes"
            className={cn('pcc-notes-tab', filterTab === 'all' && 'pcc-notes-tab--active')}
            onClick={() => setFilterTab('all')}
          >
            All Notes
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'pinned'}
            aria-label="Show pinned notes"
            className={cn('pcc-notes-tab', filterTab === 'pinned' && 'pcc-notes-tab--active')}
            onClick={() => setFilterTab('pinned')}
          >
            Pinned
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'checklists'}
            aria-label="Show checklist notes"
            className={cn('pcc-notes-tab', filterTab === 'checklists' && 'pcc-notes-tab--active')}
            onClick={() => setFilterTab('checklists')}
          >
            Checklists
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={filterTab === 'trash'}
            aria-label="Show trashed notes"
            className={cn('pcc-notes-tab', filterTab === 'trash' && 'pcc-notes-tab--active')}
            onClick={() => setFilterTab('trash')}
          >
            Trash
          </button>
        </div>

        {/* Mobile Filter & View Switcher Row */}
        <div className="pcc-notes-mobile-controls-row">
          <select
            id="notes-mobile-filter"
            className="pcc-notes-mobile-filter-select"
            value={filterTab}
            aria-label="Filter notes by view"
            onChange={(e) => setFilterTab(e.target.value as 'all' | 'pinned' | 'checklists' | 'trash')}
          >
            <option value="all">All Notes</option>
            <option value="pinned">Pinned Notes</option>
            <option value="checklists">Checklists</option>
            <option value="trash">Trash</option>
          </select>

          <div className="pcc-notes-view-switcher pcc-notes-view-switcher--mobile">
            <button
              type="button"
              className={cn('pcc-notes-view-btn', galleryView === 'grid' && 'pcc-notes-view-btn--active')}
              onClick={() => setGalleryView('grid')}
              title="Grid View"
              aria-label="Switch to grid gallery view"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
            </button>
            <button
              type="button"
              className={cn('pcc-notes-view-btn', galleryView === 'list' && 'pcc-notes-view-btn--active')}
              onClick={() => setGalleryView('list')}
              title="List View"
              aria-label="Switch to list gallery view"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Trash View Banner Header */}
      {filterTab === 'trash' && notes.some((n) => n.trashed) && (
        <div className="pcc-notes-trash-banner">
          <span>Notes in Trash are saved locally until you empty the trash.</span>
          <Button
            variant="outline"
            size="sm"
            style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
            onClick={() => {
              if (window.confirm('Empty all notes from Trash? This cannot be undone.')) {
                emptyTrash();
                addToast({ type: 'info', title: 'Trash Emptied', message: 'All trashed notes deleted.' });
              }
            }}
          >
            Empty Trash
          </Button>
        </div>
      )}

      {/* 4. Note Gallery Grid / List */}
      <div className="pcc-notes-gallery-container">
        {filteredNotes.length === 0 ? (
          <EmptyState
            title={
              filterTab === 'trash'
                ? 'Trash is empty'
                : filterTab === 'pinned'
                ? 'No pinned notes'
                : filterTab === 'checklists'
                ? 'No checklists found'
                : searchQuery
                ? 'No matching notes found'
                : 'No notes here yet'
            }
            description={
              filterTab === 'trash'
                ? 'Notes deleted from your workspace will show up here.'
                : filterTab === 'pinned'
                ? 'Pin important notes to access them quickly.'
                : filterTab === 'checklists'
                ? 'Create checklists to track your tasks and to-dos.'
                : searchQuery
                ? 'Try adjusting your search terms.'
                : 'Click "Take a note..." above to capture your ideas!'
            }
            actionLabel={filterTab === 'all' ? '+ Take a Note' : undefined}
            onAction={filterTab === 'all' ? () => handleQuickCreate('text') : undefined}
          />
        ) : (
          <>
            {/* PINNED SECTION (When filterTab is 'all' and there are pinned notes) */}
            {filterTab === 'all' && pinnedNotes.length > 0 && (
              <div className="pcc-notes-gallery-section">
                <div className="pcc-notes-section-heading">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="var(--color-accent)">
                    <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                  </svg>
                  PINNED
                </div>
                <div className={cn('pcc-notes-gallery', galleryView === 'list' && 'pcc-notes-gallery--list')}>
                  {pinnedNotes.map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}

            {/* OTHERS / ALL SECTION */}
            {(filterTab !== 'all' ? filteredNotes : otherNotes).length > 0 && (
              <div className="pcc-notes-gallery-section">
                {filterTab === 'all' && pinnedNotes.length > 0 && (
                  <div className="pcc-notes-section-heading">OTHERS</div>
                )}
                <div className={cn('pcc-notes-gallery', galleryView === 'list' && 'pcc-notes-gallery--list')}>
                  {(filterTab === 'all' ? otherNotes : filteredNotes).map((note) => renderNoteCard(note))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 5. Streamlined Note Editor Overlay Modal */}
      {activeNote && (
        <div
          className="pcc-note-modal-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div
            className={cn(
              'pcc-note-editor-modal',
              `pcc-note-color-${localColor || 'default'}`
            )}
          >
            {/* Modal Header Bar */}
            <div className="pcc-note-editor-modal__header">
              <div className="pcc-note-editor-modal__header-left">
                {/* Type Switcher Toggle */}
                <div className="pcc-note-type-toggle">
                  <button
                    type="button"
                    className={cn('pcc-note-type-btn', localType === 'text' && 'pcc-note-type-btn--active')}
                    aria-label="Switch note format to text document"
                    onClick={() => handleTypeToggle('text')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    Text
                  </button>
                  <button
                    type="button"
                    className={cn('pcc-note-type-btn', localType === 'checklist' && 'pcc-note-type-btn--active')}
                    aria-label="Switch note format to checklist"
                    onClick={() => handleTypeToggle('checklist')}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Checklist
                  </button>
                </div>
              </div>

              <div className="pcc-note-editor-modal__header-right">
                {/* Color Palette Picker Bar */}
                <div className="pcc-note-color-picker" role="radiogroup" aria-label="Color themes">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      role="radio"
                      aria-checked={localColor === c.id}
                      className={cn(
                        'pcc-note-color-dot',
                        `pcc-note-color-dot--${c.id}`,
                        localColor === c.id && 'pcc-note-color-dot--active'
                      )}
                      title={c.name}
                      aria-label={`Select ${c.name} color theme`}
                      onClick={() => handleColorChange(c.id)}
                    />
                  ))}
                </div>

                {/* Autosave Indicator */}
                <span className="pcc-note-autosave-badge">
                  <span
                    className={cn(
                      'pcc-note-autosave-dot',
                      (saveStatus === 'saving' || isSaving) && 'pcc-note-autosave-dot--saving'
                    )}
                  />
                  {saveStatus === 'saving' || isSaving ? 'Saving...' : 'Saved'}
                </span>

                {/* Modal Close Button */}
                <button
                  type="button"
                  className="pcc-note-modal-close-btn"
                  onClick={closeModal}
                  title="Close Note"
                  aria-label="Close note editor modal"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="pcc-note-editor-modal__body">
              {/* Title Field */}
              <input
                className="pcc-note-editor__title-input"
                placeholder="Title"
                aria-label="Note title"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />

              {/* CHECKLIST MODE EDITOR */}
              {localType === 'checklist' ? (
                <div className="pcc-checklist-editor">
                  {/* Progress Bar */}
                  {totalChecklistCount > 0 && (
                    <div className="pcc-checklist-progress">
                      <div className="pcc-checklist-progress-info">
                        <span>
                          {completedChecklistCount} of {totalChecklistCount} items completed ({checklistPercent}%)
                        </span>
                      </div>
                      <div className="pcc-checklist-progress-track">
                        <div
                          className="pcc-checklist-progress-bar"
                          style={{ width: `${checklistPercent}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Item Rows */}
                  <div className="pcc-checklist-items-list">
                    {localChecklistItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className={cn(
                          'pcc-checklist-item-row',
                          item.completed && 'pcc-checklist-item-row--completed'
                        )}
                      >
                        <input
                          type="checkbox"
                          className="pcc-checklist-checkbox"
                          aria-label={`Toggle completion for item ${item.text || idx + 1}`}
                          checked={item.completed}
                          onChange={() => handleChecklistItemToggle(item.id)}
                        />
                        <input
                          ref={(el) => (checklistRefs.current[item.id] = el)}
                          type="text"
                          className="pcc-checklist-item-input"
                          placeholder="List item..."
                          aria-label={`Checklist item ${idx + 1}`}
                          value={item.text}
                          onChange={(e) => handleChecklistItemTextChange(item.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddChecklistItemAfter(idx);
                            } else if (
                              e.key === 'Backspace' &&
                              item.text === '' &&
                              localChecklistItems.length > 1
                            ) {
                              e.preventDefault();
                              handleDeleteChecklistItem(item.id, idx);
                            }
                          }}
                        />
                        <button
                          type="button"
                          className="pcc-checklist-delete-btn"
                          title="Delete item"
                          aria-label={`Delete checklist item ${item.text || idx + 1}`}
                          onClick={() => handleDeleteChecklistItem(item.id, idx)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Checklist Row Button */}
                  <button
                    type="button"
                    className="pcc-checklist-add-btn"
                    onClick={() => handleAddChecklistItemAfter(localChecklistItems.length - 1)}
                  >
                    + List item
                  </button>
                </div>
              ) : (
                /* TEXT MODE EDITOR */
                <div className="pcc-text-editor-container">
                  {/* Editor Mode Tabs */}
                  <div className="pcc-text-editor-tabs">
                    <button
                      type="button"
                      className={cn('pcc-text-tab', textEditorMode === 'edit' && 'pcc-text-tab--active')}
                      onClick={() => setTextEditorMode('edit')}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className={cn('pcc-text-tab', textEditorMode === 'split' && 'pcc-text-tab--active')}
                      onClick={() => setTextEditorMode('split')}
                    >
                      Split
                    </button>
                    <button
                      type="button"
                      className={cn('pcc-text-tab', textEditorMode === 'preview' && 'pcc-text-tab--active')}
                      onClick={() => setTextEditorMode('preview')}
                    >
                      Preview
                    </button>
                    <span className="pcc-text-word-count">{wordCount} words</span>
                  </div>

                  <div
                    className={cn(
                      'pcc-text-editor-content',
                      textEditorMode === 'split' && 'pcc-text-editor-content--split'
                    )}
                  >
                    {(textEditorMode === 'edit' || textEditorMode === 'split') && (
                      <textarea
                        className="pcc-text-textarea"
                        placeholder="Start typing your note (supports Markdown format)..."
                        aria-label="Note content markdown editor"
                        value={localContent}
                        onChange={(e) => handleContentChange(e.target.value)}
                      />
                    )}
                    {(textEditorMode === 'preview' || textEditorMode === 'split') && (
                      <div className="pcc-text-preview-pane">
                        <MarkdownPreview content={localContent} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions Bar */}
            <div className="pcc-note-editor-modal__footer">
              <div className="pcc-note-footer-actions-left">
                {/* Pin Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinNote(activeNote.id)}
                  title={activeNote.pinned ? 'Unpin note' : 'Pin note'}
                  aria-label={activeNote.pinned ? 'Unpin note' : 'Pin note'}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="15"
                      height="15"
                      fill={activeNote.pinned ? 'var(--color-accent)' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    </svg>
                  }
                >
                  <span className="pcc-note-btn-text">{activeNote.pinned ? 'Pinned' : 'Pin'}</span>
                </Button>

                {/* Trash / Restore Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    if (activeNote.trashed) {
                      await restoreNote(activeNote.id);
                      addToast({ type: 'info', title: 'Note Restored', message: 'Restored from Trash.' });
                    } else {
                      await trashNote(activeNote.id);
                      closeModal();
                      addToast({ type: 'warning', title: 'Note Trashed', message: 'Moved note to Trash.' });
                    }
                  }}
                  title={activeNote.trashed ? 'Restore note' : 'Trash note'}
                  aria-label={activeNote.trashed ? 'Restore note' : 'Trash note'}
                  icon={
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  }
                >
                  <span className="pcc-note-btn-text">{activeNote.trashed ? 'Restore' : 'Trash'}</span>
                </Button>

                {/* Duplicate Note */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDuplicateNote}
                  title="Duplicate Note"
                  aria-label="Duplicate note"
                  icon={
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  }
                >
                  <span className="pcc-note-btn-text">Duplicate</span>
                </Button>

                {/* Export File */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportNote}
                  title="Export Markdown/Text"
                  aria-label="Export note as markdown file"
                  icon={
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                  }
                >
                  <span className="pcc-note-btn-text">Export</span>
                </Button>
              </div>

              <div className="pcc-note-footer-actions-right">
                {activeNote.trashed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    style={{ color: 'var(--color-error)' }}
                    aria-label="Permanently delete note"
                    onClick={async () => {
                      if (window.confirm(`Permanently delete "${activeNote.title}"?`)) {
                        await deleteNote(activeNote.id);
                        closeModal();
                        addToast({ type: 'error', title: 'Deleted', message: 'Note permanently deleted.' });
                      }
                    }}
                  >
                    Delete Permanently
                  </Button>
                )}
                <Button variant="primary" size="sm" onClick={closeModal} aria-label="Save and close note editor">
                  Done
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Helper renderer for individual note cards in the gallery
  function renderNoteCard(note: Note) {
    const isSelected = activeNoteId === note.id;
    const cardColor = note.color || 'default';

    // Strip markdown formatting for text snippet preview
    const plainSnippet = note.content
      ? note.content
          .replace(/^[#\s\->*`]+/gm, '')
          .replace(/\[[ xX]\]/g, '')
          .slice(0, 120)
      : '';

    const previewItems = note.checklistItems ? note.checklistItems.slice(0, 4) : [];
    const remainingItemsCount = note.checklistItems ? note.checklistItems.length - 4 : 0;

    return (
      <div
        key={note.id}
        id={`note-card-${note.id}`}
        tabIndex={0}
        role="button"
        aria-label={`Open note: ${note.title.trim() || 'Untitled Note'}`}
        className={cn(
          'pcc-note-card',
          `pcc-note-color-${cardColor}`,
          note.pinned && 'pcc-note-card--pinned',
          isSelected && 'pcc-note-card--selected'
        )}
        onClick={() => setActiveNoteId(note.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setActiveNoteId(note.id);
          }
        }}
      >
        {/* Card Header */}
        <div className="pcc-note-card__header">
          <h3 className="pcc-note-card__title">{note.title.trim() || 'Untitled Note'}</h3>

          {/* Pin Button on Card */}
          <button
            type="button"
            className={cn('pcc-note-card__pin-btn', note.pinned && 'pcc-note-card__pin-btn--pinned')}
            title={note.pinned ? 'Unpin note' : 'Pin note'}
            aria-label={note.pinned ? 'Unpin note' : 'Pin note'}
            onClick={(e) => {
              e.stopPropagation();
              togglePinNote(note.id);
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width="14"
              height="14"
              fill={note.pinned ? 'var(--color-accent)' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
            </svg>
          </button>
        </div>

        {/* Card Body / Preview */}
        <div className="pcc-note-card__body">
          {note.type === 'checklist' ? (
            <div className="pcc-note-card__checklist-preview">
              {previewItems.length === 0 ? (
                <p className="pcc-note-card__empty-text">Empty checklist</p>
              ) : (
                previewItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      'pcc-note-card__checklist-row',
                      item.completed && 'pcc-note-card__checklist-row--completed'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      useNoteStore.getState().toggleChecklistItem(note.id, item.id);
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.completed}
                      readOnly
                      aria-label={`Toggle checklist item ${item.text || 'Item'}`}
                      className="pcc-note-card__checkbox"
                    />
                    <span className="pcc-note-card__checklist-text">{item.text || 'Item'}</span>
                  </div>
                ))
              )}
              {remainingItemsCount > 0 && (
                <span className="pcc-note-card__more-items">+ {remainingItemsCount} more items</span>
              )}
            </div>
          ) : (
            <p className="pcc-note-card__snippet">{plainSnippet.trim() || 'Empty note...'}</p>
          )}
        </div>

        {/* Card Footer */}
        <div className="pcc-note-card__footer">
          <div className="pcc-note-card__meta">
            <span className="pcc-note-card__date">{formatDate(note.updatedAt)}</span>
          </div>

          {/* Hover Quick Actions */}
          <div className="pcc-note-card__actions" onClick={(e) => e.stopPropagation()}>
            {note.trashed ? (
              <>
                <button
                  type="button"
                  className="pcc-note-card__action-btn"
                  title="Restore Note"
                  aria-label="Restore note from trash"
                  onClick={() => restoreNote(note.id)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="pcc-note-card__action-btn"
                  title="Delete Permanently"
                  aria-label="Permanently delete note"
                  onClick={() => deleteNote(note.id)}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </>
            ) : (
              <button
                type="button"
                className="pcc-note-card__action-btn"
                title="Trash Note"
                aria-label="Move note to trash"
                onClick={() => trashNote(note.id)}
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
};
