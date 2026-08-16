import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { searchApi } from '../../services/api';
import type { SearchResultItem, SearchEntityType } from '../../types';
import { Spinner } from '../../components/ui/Spinner';
import { soundEffects } from '../../utils/audio';
import './SearchPage.css';

interface EntityMetaConfig {
  label: string;
  singular: string;
  icon: React.ReactNode;
  tagClass: string;
}

const ENTITY_CONFIG: Record<SearchEntityType, EntityMetaConfig> = {
  task: {
    label: 'Tasks',
    singular: 'Task',
    tagClass: 'pcc-search-card__type-tag--task',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <polyline points="9 11 12 14 22 4" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
      </svg>
    ),
  },
  project: {
    label: 'Projects',
    singular: 'Project',
    tagClass: 'pcc-search-card__type-tag--project',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  note: {
    label: 'Notes',
    singular: 'Note',
    tagClass: 'pcc-search-card__type-tag--note',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
      </svg>
    ),
  },
  idea: {
    label: 'Ideas',
    singular: 'Idea',
    tagClass: 'pcc-search-card__type-tag--idea',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5.76.76 1.23 1.52 1.41 2.5" />
      </svg>
    ),
  },
  calendar_event: {
    label: 'Calendar',
    singular: 'Event',
    tagClass: 'pcc-search-card__type-tag--calendar_event',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  contact: {
    label: 'Contacts',
    singular: 'Contact',
    tagClass: 'pcc-search-card__type-tag--contact',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    ),
  },
  goal: {
    label: 'Goals',
    singular: 'Goal',
    tagClass: 'pcc-search-card__type-tag--goal',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </svg>
    ),
  },
  finance: {
    label: 'Finances',
    singular: 'Finance',
    tagClass: 'pcc-search-card__type-tag--finance',
    icon: (
      <span style={{ fontWeight: 'bold', fontSize: '13px', lineHeight: 1 }}>₹</span>
    ),
  },
  reminder: {
    label: 'Reminders',
    singular: 'Reminder',
    tagClass: 'pcc-search-card__type-tag--reminder',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    ),
  },
};

const SUGGESTED_TAGS = [
  'Urgent tasks',
  'Active roadmap',
  'Architecture notes',
  'Quarterly goals',
  'Subscriptions',
  'Team contacts',
  'Scheduled meetings',
];

const RECENT_SEARCHES_KEY = 'pcc_recent_searches';

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeType, setActiveType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grouped' | 'flat'>('grouped');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [countsByType, setCountsByType] = useState<Record<string, number>>({});
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Save recent search
  const saveRecentSearch = useCallback((term: string) => {
    if (!term || term.trim().length < 2) return;
    const clean = term.trim();
    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== clean.toLowerCase());
      const next = [clean, ...filtered].slice(0, 8);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore storage quota issues
      }
      return next;
    });
  }, []);

  const removeRecentSearch = (e: React.MouseEvent, term: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // ignore
    }
  };

  // Keyboard shortcut listener (/ to focus, Esc to clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === inputRef.current) {
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Perform backend search
  const performSearch = useCallback(
    async (searchTerm: string, selectedType: string) => {
      const cleanTerm = searchTerm.trim();
      if (!cleanTerm) {
        setResults([]);
        setCountsByType({});
        setTotalCount(0);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);

      try {
        const typesParam = selectedType === 'all' ? undefined : [selectedType];
        const res = await searchApi.search({
          q: cleanTerm,
          types: typesParam,
          limit: 100,
        });

        setResults(res.data || []);
        setTotalCount(res.meta?.total || 0);
        setCountsByType(res.meta?.counts_by_type || {});
        saveRecentSearch(cleanTerm);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    },
    [saveRecentSearch]
  );

  // Debounced search on query or activeType change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        setSearchParams({ q: query.trim() }, { replace: true });
        performSearch(query, activeType);
      } else {
        setSearchParams({}, { replace: true });
        setResults([]);
        setCountsByType({});
        setTotalCount(0);
        setHasSearched(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, activeType, performSearch, setSearchParams]);

  // Group results by entity type
  const groupedResults = useMemo(() => {
    const map = new Map<SearchEntityType, SearchResultItem[]>();
    results.forEach((item) => {
      const list = map.get(item.entity_type) || [];
      list.push(item);
      map.set(item.entity_type, list);
    });
    return Array.from(map.entries()).map(([entityType, items]) => ({
      entityType,
      config: ENTITY_CONFIG[entityType] || {
        label: entityType,
        singular: entityType,
        tagClass: 'pcc-search-card__type-tag--task',
        icon: null,
      },
      items,
    }));
  }, [results]);

  // Highlight matched terms in text
  const highlightMatch = (text: string | undefined, searchTerm: string) => {
    if (!text) return null;
    const tokens = searchTerm.trim().split(/\s+/).filter(Boolean).map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    const tokenSet = new Set(tokens.map((t) => t.toLowerCase()));

    return parts.map((part, i) =>
      tokenSet.has(part.toLowerCase()) ? (
        <mark key={i} className="pcc-search-highlight">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const handleCardClick = (item: SearchResultItem) => {
    soundEffects.playPip();
    navigate(item.url);
  };

  const renderMetadataChips = (item: SearchResultItem) => {
    const m = item.metadata || {};
    const chips: React.ReactNode[] = [];

    if (m.status) {
      chips.push(
        <span key="status" className="pcc-search-chip">
          Status: <strong>{String(m.status)}</strong>
        </span>
      );
    }
    if (m.priority && m.priority !== 'none') {
      chips.push(
        <span key="priority" className="pcc-search-chip">
          Priority: <strong>{String(m.priority)}</strong>
        </span>
      );
    }
    if (m.amount !== undefined) {
      chips.push(
        <span key="amount" className="pcc-search-chip" style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>
          ₹{Number(m.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      );
    }
    if (m.category) {
      chips.push(
        <span key="cat" className="pcc-search-chip">
          {String(m.category)}
        </span>
      );
    }
    if (m.organization) {
      chips.push(
        <span key="org" className="pcc-search-chip">
          {String(m.organization)}
        </span>
      );
    }
    if (m.role) {
      chips.push(
        <span key="role" className="pcc-search-chip">
          {String(m.role)}
        </span>
      );
    }
    if (m.due_date || m.deadline) {
      chips.push(
        <span key="due" className="pcc-search-chip">
          Due: {String(m.due_date || m.deadline)}
        </span>
      );
    }
    if (m.start_time) {
      chips.push(
        <span key="start" className="pcc-search-chip">
          Time: {new Date(m.start_time).toLocaleDateString()}
        </span>
      );
    }
    if (m.progress !== undefined) {
      chips.push(
        <span key="prog" className="pcc-search-chip">
          {Math.round(Number(m.progress))}% Done
        </span>
      );
    }

    return chips;
  };

  return (
    <div className="pcc-search-page">
      {/* Header */}
      <div className="pcc-search-header">
        <h1 className="pcc-search-header__title">
          <span className="pcc-search-header__title-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="20" height="20">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </span>
          Global Search & Knowledge Index
        </h1>
        <p className="pcc-search-header__subtitle">
          Instant full-text discovery across tasks, projects, notes, ideas, calendar, contacts, goals, and finances.
        </p>
      </div>

      {/* Main Glass Search Box Card */}
      <div className="pcc-search-box-card">
        <div className="pcc-search-input-wrapper">
          <svg className="pcc-search-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>

          <input
            ref={inputRef}
            id="global-search-input"
            className="pcc-search-input"
            type="text"
            placeholder="Search keywords, titles, tags, notes, dates, or contacts..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />

          <div className="pcc-search-input-actions">
            {loading && <Spinner size="sm" />}
            {query && (
              <button
                type="button"
                className="pcc-search-clear-btn"
                onClick={() => {
                  soundEffects.playPip();
                  setQuery('');
                  inputRef.current?.focus();
                }}
                title="Clear search"
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
            <span className="pcc-search-shortcut-badge">/</span>
          </div>
        </div>

        {/* Entity Type Filter Pills */}
        <div className="pcc-search-filters-bar">
          <button
            type="button"
            className={`pcc-search-filter-pill ${activeType === 'all' ? 'pcc-search-filter-pill--active' : ''}`}
            onClick={() => {
              soundEffects.playPip();
              setActiveType('all');
            }}
          >
            All Results
            {hasSearched && <span className="pcc-search-filter-pill__count">{totalCount}</span>}
          </button>

          {(Object.keys(ENTITY_CONFIG) as SearchEntityType[]).map((typeKey) => {
            const config = ENTITY_CONFIG[typeKey];
            const count = countsByType[typeKey === 'calendar_event' ? 'calendar_events' : `${typeKey}s`] || countsByType[typeKey] || 0;
            const isActive = activeType === typeKey || activeType === `${typeKey}s` || (typeKey === 'calendar_event' && activeType === 'calendar_events');

            return (
              <button
                key={typeKey}
                type="button"
                className={`pcc-search-filter-pill ${isActive ? 'pcc-search-filter-pill--active' : ''}`}
                onClick={() => {
                  soundEffects.playPip();
                  setActiveType(isActive ? 'all' : typeKey);
                }}
              >
                {config.icon}
                {config.label}
                {hasSearched && count > 0 && <span className="pcc-search-filter-pill__count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Controls Bar */}
      {hasSearched && !loading && (
        <div className="pcc-search-toolbar">
          <div className="pcc-search-summary-text">
            Found <strong>{totalCount}</strong> matching {totalCount === 1 ? 'item' : 'items'} for{' '}
            <strong>"{query}"</strong>
          </div>

          <div className="pcc-search-toolbar-actions">
            <div className="pcc-search-view-btn-group">
              <button
                type="button"
                className={`pcc-search-view-btn ${viewMode === 'grouped' ? 'pcc-search-view-btn--active' : ''}`}
                onClick={() => {
                  soundEffects.playPip();
                  setViewMode('grouped');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Grouped
              </button>
              <button
                type="button"
                className={`pcc-search-view-btn ${viewMode === 'flat' ? 'pcc-search-view-btn--active' : ''}`}
                onClick={() => {
                  soundEffects.playPip();
                  setViewMode('flat');
                }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <line x1="8" y1="6" x2="21" y2="6" />
                  <line x1="8" y1="12" x2="21" y2="12" />
                  <line x1="8" y1="18" x2="21" y2="18" />
                  <line x1="3" y1="6" x2="3.01" y2="6" />
                  <line x1="3" y1="12" x2="3.01" y2="12" />
                  <line x1="3" y1="18" x2="3.01" y2="18" />
                </svg>
                Ranked List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="pcc-search-loading">
          <Spinner size="lg" />
          <span>Searching across all workspaces and records...</span>
        </div>
      )}

      {/* Results Content */}
      {!loading && hasSearched && results.length > 0 && (
        <div className="pcc-search-results-container">
          {viewMode === 'grouped' ? (
            groupedResults.map((group) => (
              <div key={group.entityType} className="pcc-search-group">
                <div className="pcc-search-group__header">
                  <div className="pcc-search-group__title">
                    {group.config.icon}
                    {group.config.label}
                  </div>
                  <span className={`pcc-search-card__type-tag ${group.config.tagClass}`}>
                    {group.items.length} {group.items.length === 1 ? 'match' : 'matches'}
                  </span>
                </div>

                <div className="pcc-search-results-list">
                  {group.items.map((item) => (
                    <div
                      key={`${item.entity_type}-${item.id}`}
                      className="pcc-search-card"
                      onClick={() => handleCardClick(item)}
                      role="button"
                      tabIndex={0}
                    >
                      <div className="pcc-search-card__header">
                        <div className="pcc-search-card__title-row">
                          <span className={`pcc-search-card__type-tag ${ENTITY_CONFIG[item.entity_type]?.tagClass || ''}`}>
                            {ENTITY_CONFIG[item.entity_type]?.singular || item.entity_type}
                          </span>
                          <h3 className="pcc-search-card__title">{highlightMatch(item.title, query)}</h3>
                        </div>
                        <span className="pcc-search-card__relevance">
                          {Math.round(item.relevance * 100)}% match
                        </span>
                      </div>

                      {item.snippet && (
                        <div className="pcc-search-card__snippet">{highlightMatch(item.snippet, query)}</div>
                      )}

                      <div className="pcc-search-card__metadata">
                        {renderMetadataChips(item)}
                        <span className="pcc-search-card__arrow">Open →</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="pcc-search-results-list">
              {results.map((item) => {
                const config = ENTITY_CONFIG[item.entity_type];
                return (
                  <div
                    key={`${item.entity_type}-${item.id}`}
                    className="pcc-search-card"
                    onClick={() => handleCardClick(item)}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="pcc-search-card__header">
                      <div className="pcc-search-card__title-row">
                        <span className={`pcc-search-card__type-tag ${config?.tagClass || ''}`}>
                          {config?.icon}
                          {config?.singular || item.entity_type}
                        </span>
                        <h3 className="pcc-search-card__title">{highlightMatch(item.title, query)}</h3>
                      </div>
                      <span className="pcc-search-card__relevance">
                        {Math.round(item.relevance * 100)}% match
                      </span>
                    </div>

                    {item.snippet && (
                      <div className="pcc-search-card__snippet">{highlightMatch(item.snippet, query)}</div>
                    )}

                    <div className="pcc-search-card__metadata">
                      {renderMetadataChips(item)}
                      <span className="pcc-search-card__arrow">Open →</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Zero results state */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="pcc-search-empty">
          <svg className="pcc-search-empty__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <line x1="8" y1="11" x2="14" y2="11" />
          </svg>
          <h3 className="pcc-search-empty__title">No matching records found</h3>
          <p className="pcc-search-empty__desc">
            We couldn't find any results matching "<strong>{query}</strong>"
            {activeType !== 'all' ? ` in ${ENTITY_CONFIG[activeType as SearchEntityType]?.label || activeType}` : ''}.
            Try checking for typos or searching with broader keywords.
          </p>
          {activeType !== 'all' && (
            <button
              type="button"
              className="pcc-search-filter-pill pcc-search-filter-pill--active"
              style={{ marginTop: '8px' }}
              onClick={() => {
                soundEffects.playPip();
                setActiveType('all');
              }}
            >
              Search All Categories Instead
            </button>
          )}
        </div>
      )}

      {/* Initial Suggestions & Guides (When query is empty) */}
      {!hasSearched && (
        <div className="pcc-search-suggestions">
          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="pcc-search-suggestion-box">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="pcc-search-suggestion-box__title">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Recent Searches
                </div>
                <button
                  type="button"
                  onClick={clearAllRecent}
                  style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>

              <div className="pcc-search-recent-list">
                {recentSearches.map((term) => (
                  <div
                    key={term}
                    className="pcc-search-recent-item"
                    onClick={() => {
                      soundEffects.playPip();
                      setQuery(term);
                    }}
                  >
                    <span>{term}</span>
                    <button
                      type="button"
                      className="pcc-search-recent-remove"
                      onClick={(e) => removeRecentSearch(e, term)}
                      title="Remove from history"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Discovery Tags */}
          <div className="pcc-search-suggestion-box">
            <div className="pcc-search-suggestion-box__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              Quick Explore
            </div>
            <div className="pcc-search-quick-tags">
              {SUGGESTED_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className="pcc-search-quick-tag"
                  onClick={() => {
                    soundEffects.playPip();
                    setQuery(tag);
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Search Shortcuts & Tips */}
          <div className="pcc-search-suggestion-box">
            <div className="pcc-search-suggestion-box__title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Search Tips & Shortcuts
            </div>
            <ul className="pcc-search-tips-list">
              <li>
                <kbd>/</kbd> <span>Focus global search input immediately</span>
              </li>
              <li>
                <kbd>ESC</kbd> <span>Clear search query or dismiss focus</span>
              </li>
              <li>
                <span>✦</span> <span>Searches match titles, body content, tags, notes, and metadata</span>
              </li>
              <li>
                <span>✦</span> <span>Use entity pills above to restrict search scope</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
