import React, { useState, useEffect, useMemo } from 'react';
import { Badge, Button, Input, Modal, EmptyState } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { learningApi } from '../../services/api';
import { LearningItem, LearningResourceType, LearningStatus } from '../../types';
import './KnowledgePage.css';

const STORAGE_KEY = 'pcc_knowledge_learning_items_v1';

const INITIAL_LEARNING_ITEMS: LearningItem[] = [
  {
    id: 'learn-01',
    title: 'Distributed Systems & Raft Consensus Architecture',
    resource_type: 'course',
    url: 'https://pdos.csail.mit.edu/6.824/',
    status: 'learning',
    progress: 65,
    notes: 'MIT 6.824 labs: Completed Leader Election, working on Log Replication and Snapshotting.',
    created_at: '2026-08-01T10:00:00Z',
    updated_at: '2026-08-15T14:30:00Z',
  },
  {
    id: 'learn-02',
    title: 'Designing Data-Intensive Applications',
    resource_type: 'book',
    url: 'https://dataintensive.net',
    status: 'learning',
    progress: 80,
    notes: 'Reading Part III: Derived Data. Key insights on stream processing and Lambda vs Kappa architectures.',
    created_at: '2026-08-02T11:00:00Z',
    updated_at: '2026-08-14T09:15:00Z',
  },
  {
    id: 'learn-03',
    title: 'Staff Engineer: Leadership Beyond the Management Track',
    resource_type: 'book',
    url: 'https://staffeng.com/book',
    status: 'completed',
    progress: 100,
    notes: 'Key archetype frameworks: Tech Lead, Architect, Solver, Right Hand. Focus on organizational leverage.',
    created_at: '2026-07-15T08:00:00Z',
    updated_at: '2026-08-10T17:00:00Z',
  },
  {
    id: 'learn-04',
    title: 'FastAPI Advanced Async Architectures & Dependency Injection',
    resource_type: 'tutorial',
    url: 'https://fastapi.tiangolo.com/advanced/',
    status: 'practicing',
    progress: 50,
    notes: 'Implementing background task queues and sub-dependency caching for low latency.',
    created_at: '2026-08-05T12:00:00Z',
    updated_at: '2026-08-12T16:20:00Z',
  },
  {
    id: 'learn-05',
    title: 'React 18 Concurrent Rendering & Canvas Optimization',
    resource_type: 'video',
    url: 'https://react.dev/blog/2022/03/29/react-v18',
    status: 'completed',
    progress: 100,
    notes: 'Techniques for useTransition, useDeferredValue, and zero-jank 60fps graph rendering.',
    created_at: '2026-08-03T15:00:00Z',
    updated_at: '2026-08-11T18:45:00Z',
  },
  {
    id: 'learn-06',
    title: 'AWS Certified Solutions Architect - Professional',
    resource_type: 'certification',
    url: 'https://aws.amazon.com/certification/certified-solutions-architect-professional/',
    status: 'planned',
    progress: 15,
    notes: 'Curriculum roadmap: Multi-account AWS Organizations, transit gateway architectures, DR failovers.',
    created_at: '2026-08-08T09:00:00Z',
    updated_at: '2026-08-13T11:00:00Z',
  },
  {
    id: 'learn-07',
    title: 'Rust Systems Programming & Memory Safety Fundamentals',
    resource_type: 'technology',
    url: 'https://doc.rust-lang.org/book/',
    status: 'saved',
    progress: 0,
    notes: 'Queued for Q4: Ownership, borrowing, lifetimes, and lock-free concurrency primitives.',
    created_at: '2026-08-10T14:00:00Z',
    updated_at: '2026-08-10T14:00:00Z',
  },
];

const RESOURCE_TYPE_CONFIG: Record<LearningResourceType, { label: string; icon: string }> = {
  course: { label: 'Course', icon: '🎓' },
  book: { label: 'Book', icon: '📚' },
  video: { label: 'Video', icon: '🎥' },
  tutorial: { label: 'Tutorial', icon: '📝' },
  certification: { label: 'Certification', icon: '🏆' },
  technology: { label: 'Technology', icon: '⚡' },
};

const STATUS_CONFIG: Record<
  LearningStatus,
  { label: string; badgeVariant: 'default' | 'accent' | 'success' | 'warning' | 'info' }
> = {
  saved: { label: 'Saved (Queue)', badgeVariant: 'default' },
  planned: { label: 'Planned', badgeVariant: 'info' },
  learning: { label: 'In Progress', badgeVariant: 'accent' },
  practicing: { label: 'Practicing', badgeVariant: 'warning' },
  completed: { label: 'Completed', badgeVariant: 'success' },
};

export const KnowledgePage: React.FC = () => {
  const { toast } = useToast();

  const [items, setItems] = useState<LearningItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch {
      // Fallback
    }
    return INITIAL_LEARNING_ITEMS;
  });

  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Modal form states
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<LearningResourceType>('course');
  const [formStatus, setFormStatus] = useState<LearningStatus>('learning');
  const [formUrl, setFormUrl] = useState('');
  const [formProgress, setFormProgress] = useState(0);
  const [formNotes, setFormNotes] = useState('');

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.warn('Failed to save learning items to localStorage', e);
    }
  }, [items]);

  // Fetch from backend API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchRemoteItems = async () => {
      try {
        const response = await learningApi.getAll();
        if (response && response.data && Array.isArray(response.data) && response.data.length > 0) {
          if (isMounted) {
            setItems(response.data);
          }
        }
      } catch {
        // Backend offline or starting, local fallback active
      }
    };
    fetchRemoteItems();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const type = item.resource_type || item.resourceType || 'course';
      const status = item.status;

      if (selectedType !== 'all' && type !== selectedType) {
        return false;
      }
      if (selectedStatus !== 'all' && status !== selectedStatus) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchNotes = item.notes ? item.notes.toLowerCase().includes(q) : false;
        const matchUrl = item.url ? item.url.toLowerCase().includes(q) : false;
        return matchTitle || matchNotes || matchUrl;
      }
      return true;
    });
  }, [items, selectedType, selectedStatus, search]);

  // Stats calculation
  const stats = useMemo(() => {
    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const learning = items.filter((i) => i.status === 'learning').length;
    const avgProgress = total > 0 ? Math.round(items.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total) : 0;
    return { total, completed, learning, avgProgress };
  }, [items]);

  // Type counts for filter pills
  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: items.length };
    for (const key of Object.keys(RESOURCE_TYPE_CONFIG)) {
      counts[key] = items.filter((i) => (i.resource_type || i.resourceType) === key).length;
    }
    return counts;
  }, [items]);

  // Handle open modal for create
  const handleOpenCreateModal = () => {
    setEditingItemId(null);
    setFormTitle('');
    setFormType('course');
    setFormStatus('learning');
    setFormUrl('');
    setFormProgress(0);
    setFormNotes('');
    setIsModalOpen(true);
  };

  // Handle open modal for edit
  const handleOpenEditModal = (item: LearningItem) => {
    setEditingItemId(item.id);
    setFormTitle(item.title);
    setFormType(item.resource_type || item.resourceType || 'course');
    setFormStatus(item.status);
    setFormUrl(item.url || '');
    setFormProgress(item.progress || 0);
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  // Handle save (create or edit)
  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let computedStatus = formStatus;
    if (formProgress >= 100 && formStatus !== 'completed') {
      computedStatus = 'completed';
    }

    const payload: Partial<LearningItem> = {
      title: formTitle.trim(),
      resource_type: formType,
      status: computedStatus,
      url: formUrl.trim() || undefined,
      progress: formProgress,
      notes: formNotes.trim() || undefined,
    };

    if (editingItemId) {
      // Update existing
      try {
        await learningApi.update(editingItemId, payload);
      } catch {
        // Backend offline fallback
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === editingItemId
            ? {
                ...i,
                ...payload,
                updated_at: new Date().toISOString(),
              }
            : i
        )
      );
      toast.success(`Updated resource: "${formTitle}"`);
    } else {
      // Create new
      const tempId = `learn-${Date.now()}`;
      let createdItem: LearningItem = {
        id: tempId,
        title: formTitle.trim(),
        resource_type: formType,
        status: computedStatus,
        url: formUrl.trim() || undefined,
        progress: formProgress,
        notes: formNotes.trim() || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      try {
        const res = await learningApi.create(payload);
        if (res && res.data && res.data.id) {
          createdItem = res.data;
        }
      } catch {
        // Backend offline fallback
      }

      setItems((prev) => [createdItem, ...prev]);
      toast.success(`Added resource to Learning Hub: "${formTitle}"`);
    }

    setIsModalOpen(false);
  };

  // Handle quick progress adjustment
  const handleAdjustProgress = async (id: string, delta: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const nextProgress = Math.min(100, Math.max(0, (item.progress || 0) + delta));
    const nextStatus = nextProgress === 100 ? 'completed' : item.status === 'completed' && nextProgress < 100 ? 'learning' : item.status;

    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              progress: nextProgress,
              status: nextStatus,
              updated_at: new Date().toISOString(),
            }
          : i
      )
    );

    try {
      await learningApi.update(id, { progress: nextProgress, status: nextStatus });
    } catch {
      // Local state already updated
    }

    toast.info(`Updated progress to ${nextProgress}%`);
  };

  // Handle direct 100% completion
  const handleMarkComplete = async (id: string) => {
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              progress: 100,
              status: 'completed',
              updated_at: new Date().toISOString(),
            }
          : i
      )
    );

    try {
      await learningApi.update(id, { progress: 100, status: 'completed' });
    } catch {
      // Local state already updated
    }

    toast.success(`Resource completed! 100% mastery achieved.`);
  };

  // Handle quick status change dropdown
  const handleQuickStatusChange = async (id: string, newStatus: LearningStatus) => {
    const nextProgress = newStatus === 'completed' ? 100 : newStatus === 'saved' ? 0 : undefined;

    setItems((prev) =>
      prev.map((i) => {
        if (i.id === id) {
          return {
            ...i,
            status: newStatus,
            progress: nextProgress !== undefined ? nextProgress : i.progress,
            updated_at: new Date().toISOString(),
          };
        }
        return i;
      })
    );

    try {
      await learningApi.update(id, {
        status: newStatus,
        ...(nextProgress !== undefined ? { progress: nextProgress } : {}),
      });
    } catch {
      // Local state already updated
    }

    toast.info(`Status changed to ${STATUS_CONFIG[newStatus].label}`);
  };

  // Handle delete
  const handleDeleteItem = async (id: string, title: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    try {
      await learningApi.delete(id);
    } catch {
      // Local state already deleted
    }
    toast.warning(`Deleted resource "${title}"`);
  };

  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  return (
    <div className="pcc-knowledge-page">
      {/* Header */}
      <div className="pcc-knowledge-header">
        <div className="pcc-knowledge-header__info">
          <h1 className="pcc-knowledge-title">Knowledge Hub & Learning Center</h1>
          <p className="pcc-knowledge-subtitle">
            Curated reading lists, courses, certifications, technical cheat sheets, and skill mastery.
          </p>
        </div>
        <div className="pcc-knowledge-header__actions">
          <Button
            variant="outline"
            size="md"
            className="pcc-knowledge-mobile-filter-toggle"
            onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          >
            {isMobileFiltersOpen ? '⚡ Hide Filters' : '⚡ Show Filters'}
          </Button>
          <Button variant="primary" size="md" onClick={handleOpenCreateModal}>
            + Add Learning Resource
          </Button>
        </div>
      </div>

      {/* Collapsible Filters & Stats Container for Mobile */}
      <div className={`pcc-knowledge-panel ${!isMobileFiltersOpen ? 'pcc-knowledge-panel--mobile-collapsed' : ''}`}>
        {/* Stats Overview */}
        <div className="pcc-knowledge-stats">
          <div className="pcc-knowledge-stat-card pcc-knowledge-stat-card--total">
            <div className="pcc-knowledge-stat-card__icon">📚</div>
            <div className="pcc-knowledge-stat-card__data">
              <span className="pcc-knowledge-stat-card__value">{stats.total}</span>
              <span className="pcc-knowledge-stat-card__label">Total Resources</span>
            </div>
          </div>

          <div className="pcc-knowledge-stat-card pcc-knowledge-stat-card--learning">
            <div className="pcc-knowledge-stat-card__icon">🚀</div>
            <div className="pcc-knowledge-stat-card__data">
              <span className="pcc-knowledge-stat-card__value">{stats.learning}</span>
              <span className="pcc-knowledge-stat-card__label">Active in Progress</span>
            </div>
          </div>

          <div className="pcc-knowledge-stat-card pcc-knowledge-stat-card--completed">
            <div className="pcc-knowledge-stat-card__icon">🏆</div>
            <div className="pcc-knowledge-stat-card__data">
              <span className="pcc-knowledge-stat-card__value">{stats.completed}</span>
              <span className="pcc-knowledge-stat-card__label">Completed Materials</span>
            </div>
          </div>

          <div className="pcc-knowledge-stat-card pcc-knowledge-stat-card--progress">
            <div className="pcc-knowledge-stat-card__icon">📊</div>
            <div className="pcc-knowledge-stat-card__data">
              <span className="pcc-knowledge-stat-card__value">{stats.avgProgress}%</span>
              <span className="pcc-knowledge-stat-card__label">Avg Completion Rate</span>
            </div>
          </div>
        </div>

      {/* Toolbar & Filters */}
      <div className="pcc-knowledge-toolbar">
        <div className="pcc-knowledge-toolbar__row">
          <div className="pcc-knowledge-search">
            <Input
              id="knowledge-search-input"
              placeholder="Search by title, syllabus, or notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="pcc-status-tabs">
            <button
              type="button"
              className={`pcc-status-tab ${selectedStatus === 'all' ? 'pcc-status-tab--active' : ''}`}
              onClick={() => setSelectedStatus('all')}
            >
              All Statuses
            </button>
            {(Object.keys(STATUS_CONFIG) as LearningStatus[]).map((st) => (
              <button
                key={st}
                type="button"
                className={`pcc-status-tab ${selectedStatus === st ? 'pcc-status-tab--active' : ''}`}
                onClick={() => setSelectedStatus(st)}
              >
                {STATUS_CONFIG[st].label}
              </button>
            ))}
          </div>
        </div>

        <div className="pcc-filter-pills">
          <button
            type="button"
            className={`pcc-filter-pill ${selectedType === 'all' ? 'pcc-filter-pill--active' : ''}`}
            onClick={() => setSelectedType('all')}
          >
            <span>All Categories</span>
            <span className="pcc-filter-pill__count">{typeCounts.all || 0}</span>
          </button>
          {(Object.keys(RESOURCE_TYPE_CONFIG) as LearningResourceType[]).map((rt) => (
            <button
              key={rt}
              type="button"
              className={`pcc-filter-pill ${selectedType === rt ? 'pcc-filter-pill--active' : ''}`}
              onClick={() => setSelectedType(rt)}
            >
              <span>
                {RESOURCE_TYPE_CONFIG[rt].icon} {RESOURCE_TYPE_CONFIG[rt].label}
              </span>
              <span className="pcc-filter-pill__count">{typeCounts[rt] || 0}</span>
            </button>
          ))}
        </div>
      </div>
      </div>

      {/* Learning Items Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          title="No Learning Resources Found"
          description="Try clearing your search filters or add a new course, book, or video to your syllabus."
          actionLabel="Add Resource"
          onAction={handleOpenCreateModal}
        />
      ) : (
        <div className="pcc-knowledge-grid">
          {filteredItems.map((item) => {
            const rType = (item.resource_type || item.resourceType || 'course') as LearningResourceType;
            const typeConfig = RESOURCE_TYPE_CONFIG[rType] || RESOURCE_TYPE_CONFIG.course;
            const statusConfig = STATUS_CONFIG[item.status] || STATUS_CONFIG.learning;
            const isFinished = item.progress >= 100 || item.status === 'completed';

            return (
              <div key={item.id} className="pcc-learning-card">
                <div className="pcc-learning-card__header">
                  <div className="pcc-learning-card__badges">
                    <span className="pcc-learning-card__type-badge">
                      <span>{typeConfig.icon}</span>
                      <span>{typeConfig.label}</span>
                    </span>
                    <Badge variant={statusConfig.badgeVariant} size="sm">
                      {statusConfig.label}
                    </Badge>
                  </div>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="pcc-learning-card__menu-btn"
                      title="Edit Resource"
                      onClick={() => handleOpenEditModal(item)}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="pcc-learning-card__menu-btn"
                      title="Delete Resource"
                      onClick={() => handleDeleteItem(item.id, item.title)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div className="pcc-learning-card__content">
                  <h3 className="pcc-learning-card__title">{item.title}</h3>

                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pcc-learning-card__url"
                      title="Open external resource"
                    >
                      <span>🔗 Visit Material</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                      </svg>
                    </a>
                  )}

                  {item.notes && <div className="pcc-learning-card__notes">{item.notes}</div>}
                </div>

                <div className="pcc-learning-card__progress-container">
                  <div className="pcc-learning-card__progress-header">
                    <span className="pcc-learning-card__progress-label">Syllabus Progress</span>
                    <span className="pcc-learning-card__progress-val">{item.progress}%</span>
                  </div>

                  <div className="pcc-learning-progress-bar">
                    <div
                      className={`pcc-learning-progress-bar__fill ${
                        isFinished ? 'pcc-learning-progress-bar__fill--completed' : ''
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>

                  <div className="pcc-learning-card__controls">
                    <div className="pcc-learning-card__step-btns">
                      <button
                        type="button"
                        className="pcc-step-btn"
                        onClick={() => handleAdjustProgress(item.id, -10)}
                        title="Decrease 10%"
                      >
                        -10%
                      </button>
                      <button
                        type="button"
                        className="pcc-step-btn"
                        onClick={() => handleAdjustProgress(item.id, 10)}
                        title="Increase 10%"
                      >
                        +10%
                      </button>
                      {!isFinished && (
                        <button
                          type="button"
                          className="pcc-step-btn"
                          style={{ color: 'var(--color-success)', fontWeight: 'bold' }}
                          onClick={() => handleMarkComplete(item.id)}
                          title="Mark Complete"
                        >
                          ✓ 100%
                        </button>
                      )}
                    </div>

                    <select
                      className="pcc-learning-card__quick-status"
                      value={item.status}
                      onChange={(e) => handleQuickStatusChange(item.id, e.target.value as LearningStatus)}
                    >
                      {(Object.keys(STATUS_CONFIG) as LearningStatus[]).map((st) => (
                        <option key={st} value={st}>
                          {STATUS_CONFIG[st].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Resource Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItemId ? 'Edit Learning Resource' : 'Add New Learning Resource'}
        size="md"
        id="knowledge-resource-modal"
      >
        <form onSubmit={handleSaveItem} className="pcc-learning-form">
          <Input
            id="resource-title-input"
            label="Resource Title *"
            placeholder="e.g. Designing Data-Intensive Applications"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
          />

          <div className="pcc-learning-form__row">
            <div className="pcc-form-group">
              <label htmlFor="resource-type-select" className="pcc-form-label">
                Resource Category
              </label>
              <select
                id="resource-type-select"
                className="pcc-form-select"
                value={formType}
                onChange={(e) => setFormType(e.target.value as LearningResourceType)}
              >
                {(Object.keys(RESOURCE_TYPE_CONFIG) as LearningResourceType[]).map((rt) => (
                  <option key={rt} value={rt}>
                    {RESOURCE_TYPE_CONFIG[rt].icon} {RESOURCE_TYPE_CONFIG[rt].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="pcc-form-group">
              <label htmlFor="resource-status-select" className="pcc-form-label">
                Current Status
              </label>
              <select
                id="resource-status-select"
                className="pcc-form-select"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as LearningStatus)}
              >
                {(Object.keys(STATUS_CONFIG) as LearningStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_CONFIG[st].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            id="resource-url-input"
            label="Resource URL / Link"
            type="url"
            placeholder="https://..."
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
          />

          <div className="pcc-form-group">
            <label htmlFor="resource-progress-slider" className="pcc-form-label">
              Progress: {formProgress}%
            </label>
            <div className="pcc-slider-container">
              <input
                id="resource-progress-slider"
                type="range"
                min="0"
                max="100"
                step="5"
                className="pcc-slider"
                value={formProgress}
                onChange={(e) => setFormProgress(Number(e.target.value))}
              />
              <span className="pcc-slider-value">{formProgress}%</span>
            </div>
          </div>

          <div className="pcc-form-group">
            <label htmlFor="resource-notes-textarea" className="pcc-form-label">
              Notes & Key Takeaways
            </label>
            <textarea
              id="resource-notes-textarea"
              className="pcc-form-textarea"
              placeholder="Key concepts, syllabus checklist, lecture timestamps, or chapter takeaways..."
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
            />
          </div>

          <div className="pcc-modal-footer-btns">
            <Button variant="ghost" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              {editingItemId ? 'Update Resource' : 'Save to Learning Hub'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KnowledgePage;
