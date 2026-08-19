import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNoteStore } from '../../stores/noteStore';
import { useToast } from '../../hooks/useToast';
import { Note } from '../../types';
import { Button, Input, Badge, EmptyState } from '../../components/ui';
import { MarkdownPreview } from './MarkdownPreview';
import { formatDate, cn } from '../../utils';
import './Notes.css';

const CATEGORIES = ['All', 'Engineering', 'Architecture', 'Knowledge', 'Personal', 'Ideas', 'General'];

export const NotesWorkspace: React.FC = () => {
  const {
    notes,
    selectedCategory,
    searchQuery,
    isSaving,
    addNote,
    updateNote,
    deleteNote,
    togglePinNote,
    setActiveNoteId,
    setSelectedCategory,
    setSearchQuery,
    getActiveNote,
  } = useNoteStore();

  const { addToast } = useToast();

  const activeNote = getActiveNote();

  // Local draft states for snappy typing without lag
  const [localTitle, setLocalTitle] = useState(activeNote?.title || '');
  const [localContent, setLocalContent] = useState(activeNote?.content || '');
  const [localCategory, setLocalCategory] = useState(activeNote?.category || 'General');
  const [viewMode, setViewMode] = useState<'split' | 'edit' | 'preview'>(() => {
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      return 'edit';
    }
    return 'split';
  });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  // Force single-pane view mode on narrow viewports
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768) {
        setViewMode((prev) => (prev === 'split' ? 'edit' : prev));
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debounced auto-save timer ref
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync local draft when active note changes
  useEffect(() => {
    if (activeNote) {
      setLocalTitle(activeNote.title);
      setLocalContent(activeNote.content);
      setLocalCategory(activeNote.category);
    }
  }, [activeNote?.id]);

  // Debounced auto-save handler
  const triggerAutoSave = useCallback((title: string, content: string, category: string) => {
    if (!activeNote) return;
    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      await updateNote(activeNote.id, {
        title,
        content,
        category,
      });
      setSaveStatus('saved');
    }, 600);
  }, [activeNote, updateNote]);

  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle);
    triggerAutoSave(newTitle, localContent, localCategory);
  };

  const handleContentChange = (newContent: string) => {
    setLocalContent(newContent);
    triggerAutoSave(localTitle, newContent, localCategory);
  };

  const handleCategoryChange = (newCat: string) => {
    setLocalCategory(newCat);
    triggerAutoSave(localTitle, localContent, newCat);
  };

  const handleCreateNewNote = async () => {
    await addNote({
      title: '',
      category: selectedCategory !== 'All' ? selectedCategory : 'General',
      content: '',
    });
    addToast({
      type: 'success',
      title: 'Note Created',
      message: 'New note opened for editing.',
      duration: 2500,
    });
  };

  const handleDeleteActiveNote = async () => {
    if (!activeNote) return;
    if (window.confirm(`Delete "${activeNote.title}"?`)) {
      await deleteNote(activeNote.id);
      addToast({
        type: 'error',
        title: 'Note Deleted',
        message: 'Note removed from knowledge base.',
        duration: 2500,
      });
    }
  };

  // Filter notes by search and category
  const filteredNotes = notes.filter((n) => {
    if (selectedCategory !== 'All' && n.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return n.title.toLowerCase().includes(q) || n.content.toLowerCase().includes(q);
    }
    return true;
  });

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const unpinnedNotes = filteredNotes.filter((n) => !n.pinned);

  // Word and character count
  const wordCount = localContent.trim() ? localContent.trim().split(/\s+/).length : 0;
  const charCount = localContent.length;

  const [isMobileListOpen, setIsMobileListOpen] = useState(false);

  return (
    <div className="pcc-notes-workspace" id="notes-workspace-root">
      {/* Mobile Collapsible List Toggle Bar */}
      <div className="pcc-notes-mobile-toggle-bar">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileListOpen(!isMobileListOpen)}
        >
          {isMobileListOpen ? '⬆️ Hide Notes List' : '📋 Show Notes List'} ({filteredNotes.length})
        </Button>
        {activeNote && !isMobileListOpen && (
          <span className="pcc-notes-mobile-active-note">
            Editing: <strong>{activeNote.title}</strong>
          </span>
        )}
      </div>

      {/* Left Pane: Notes Navigation */}
      <div className={cn('pcc-notes-list-pane', !isMobileListOpen && 'pcc-notes-list-pane--mobile-collapsed')}>
        <div className="pcc-notes-list__header">
          <h2 className="pcc-notes-list__title">Notes</h2>
          <Button
            variant="primary"
            size="sm"
            id="btn-new-note"
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={handleCreateNewNote}
          >
            New
          </Button>
        </div>

        {/* Search Bar */}
        <Input
          id="notes-search-input"
          placeholder="Search notes & content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />

        {/* Category Filters */}
        <div className="pcc-notes-list__categories">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={cn(
                'pcc-notes-category-chip',
                selectedCategory === cat && 'pcc-notes-category-chip--active'
              )}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notes Items List */}
        <div className="pcc-notes-items-container">
          {filteredNotes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-6) var(--space-2)', color: 'var(--color-text-tertiary)' }}>
              <p style={{ fontSize: 'var(--font-size-xs)' }}>No notes found.</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCreateNewNote}
                style={{ marginTop: 'var(--space-2)' }}
              >
                + Create one
              </Button>
            </div>
          ) : (
            <>
              {/* Pinned Section */}
              {pinnedNotes.length > 0 && (
                <>
                  <div className="pcc-notes-section-title">
                    <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
                      <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    </svg>
                    Pinned Notes
                  </div>
                  {pinnedNotes.map((note) => renderNoteCard(note))}
                </>
              )}

              {/* All / Other Notes */}
              {unpinnedNotes.length > 0 && (
                <>
                  {pinnedNotes.length > 0 && (
                    <div className="pcc-notes-section-title">All Notes</div>
                  )}
                  {unpinnedNotes.map((note) => renderNoteCard(note))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Right Pane: Markdown Editor & Preview */}
      <div className="pcc-notes-editor-pane">
        {activeNote ? (
          <>
            {/* Editor Toolbar */}
            <div className="pcc-notes-editor__toolbar">
              <div className="pcc-notes-editor__toolbar-left">
                {/* Category Select */}
                <select
                  value={localCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  style={{
                    background: 'var(--color-bg-elevated)',
                    color: 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '4px 8px',
                    fontSize: 'var(--font-size-xs)',
                  }}
                >
                  {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>

                {/* Pin Toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => togglePinNote(activeNote.id)}
                  title={activeNote.pinned ? 'Unpin Note' : 'Pin Note'}
                  icon={
                    <svg
                      viewBox="0 0 24 24"
                      width="14"
                      height="14"
                      fill={activeNote.pinned ? 'var(--color-accent)' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
                    </svg>
                  }
                >
                  {activeNote.pinned ? 'Pinned' : 'Pin'}
                </Button>

                {/* Mode Switcher */}
                <div style={{ display: 'flex', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
                  <button
                    type="button"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      background: viewMode === 'edit' ? 'var(--color-surface)' : 'transparent',
                      color: viewMode === 'edit' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    }}
                    onClick={() => setViewMode('edit')}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="pcc-notes-view-mode-btn--split"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      background: viewMode === 'split' ? 'var(--color-surface)' : 'transparent',
                      color: viewMode === 'split' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    }}
                    onClick={() => setViewMode('split')}
                  >
                    Split
                  </button>
                  <button
                    type="button"
                    style={{
                      padding: '3px 8px',
                      fontSize: '11px',
                      borderRadius: 'var(--radius-xs)',
                      background: viewMode === 'preview' ? 'var(--color-surface)' : 'transparent',
                      color: viewMode === 'preview' ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    }}
                    onClick={() => setViewMode('preview')}
                  >
                    Preview
                  </button>
                </div>
              </div>

              <div className="pcc-notes-editor__toolbar-right">
                {/* Autosave Status */}
                <span className="pcc-notes-editor__autosave-badge">
                  <span
                    className={cn(
                      'pcc-notes-editor__autosave-dot',
                      (saveStatus === 'saving' || isSaving) && 'pcc-notes-editor__autosave-dot--saving'
                    )}
                  />
                  {saveStatus === 'saving' || isSaving ? 'Saving...' : 'Saved'}
                </span>

                <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
                  {wordCount} words &bull; {charCount} chars
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteActiveNote}
                  title="Delete Note"
                  style={{ color: 'var(--color-error)' }}
                  icon={
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Editor & Preview Body */}
            <div className="pcc-notes-editor__content-area">
              <input
                className="pcc-notes-editor__title-input"
                placeholder="Untitled Note"
                value={localTitle}
                onChange={(e) => handleTitleChange(e.target.value)}
              />

              <div
                className={cn(
                  'pcc-notes-editor__body-container',
                  viewMode === 'split' && 'pcc-notes-editor__body-container--split'
                )}
              >
                {/* Editor Textarea */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <textarea
                    className="pcc-notes-editor__textarea"
                    placeholder="Start capturing thoughts..."
                    value={localContent}
                    onChange={(e) => handleContentChange(e.target.value)}
                  />
                )}

                {/* Markdown Preview */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <MarkdownPreview content={localContent} />
                )}
              </div>
            </div>
          </>
        ) : (
          <EmptyState
            title="No Note Selected"
            description="Select a note from the list on the left or create a new note."
            actionLabel="Create Note"
            onAction={handleCreateNewNote}
          />
        )}
      </div>
    </div>
  );

  function renderNoteCard(note: Note) {
    const isSelected = activeNote?.id === note.id;
    // Extract first line or snippet
    const snippet = note.content.replace(/^[#\s\->*`]+/gm, '').slice(0, 80);

    return (
      <div
        key={note.id}
        id={`note-card-${note.id}`}
        className={cn(
          'pcc-note-item-card',
          isSelected && 'pcc-note-item-card--active'
        )}
        onClick={() => {
          setActiveNoteId(note.id);
          setIsMobileListOpen(false);
        }}
      >
        <div className="pcc-note-item-card__header">
          <h4 className="pcc-note-item-card__title">{note.title.trim() || 'Untitled Note'}</h4>
          {note.pinned && (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="var(--color-accent)" style={{ flexShrink: 0 }}>
              <path d="M16 4v2H8V4h8m1-2H7a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h1v7l-2 2v2h5v5h2v-5h5v-2l-2-2v-7h1a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
            </svg>
          )}
        </div>

        <p className="pcc-note-item-card__snippet">{snippet.trim() || 'Start capturing thoughts...'}</p>

        <div className="pcc-note-item-card__footer">
          <Badge variant="default" size="sm">{note.category}</Badge>
          <span>{formatDate(note.updatedAt)}</span>
        </div>
      </div>
    );
  }
};
