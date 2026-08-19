import React, { useState } from 'react';
import { useIdeaStore } from '../../stores/ideaStore';
import { useToast } from '../../hooks/useToast';
import { Idea, IdeaStatus } from '../../types';
import { Badge, Button, Input, Modal, Dropdown } from '../../components/ui';
import { PromoteIdeaModal } from './PromoteIdeaModal';
import { cn } from '../../utils';
import './Ideas.css';

interface ColumnDef {
  id: IdeaStatus;
  title: string;
  dotClass: string;
}

const COLUMNS: ColumnDef[] = [
  { id: 'captured', title: 'Captured Sparks', dotClass: 'pcc-ideas-column__dot--captured' },
  { id: 'exploring', title: 'Exploring & Feasibility', dotClass: 'pcc-ideas-column__dot--exploring' },
  { id: 'promoted', title: 'Promoted to Action', dotClass: 'pcc-ideas-column__dot--promoted' },
  { id: 'archived', title: 'Archived / Deferred', dotClass: 'pcc-ideas-column__dot--archived' },
];

export const IdeasPage: React.FC = () => {
  const { ideas, addIdea, deleteIdea, moveIdeaStatus } = useIdeaStore();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPromoteIdea, setSelectedPromoteIdea] = useState<Idea | null>(null);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);

  // New spark modal fields
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Engineering');
  const [newImpact, setNewImpact] = useState<'low' | 'medium' | 'high'>('high');
  const [newEffort, setNewEffort] = useState<'low' | 'medium' | 'high'>('medium');
  const [newTagsInput, setNewTagsInput] = useState('');

  // Filter ideas
  const filteredIdeas = ideas.filter((i) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = i.title.toLowerCase().includes(q);
      const matchDesc = i.description.toLowerCase().includes(q);
      const matchCategory = i.category?.toLowerCase().includes(q);
      return matchTitle || matchDesc || matchCategory;
    }
    return true;
  });

  const getColumnIdeas = (status: IdeaStatus) => {
    return filteredIdeas.filter((i) => i.status === status);
  };

  const handleCaptureSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const tags = newTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    await addIdea({
      title: newTitle.trim(),
      description: newDesc.trim() || 'No additional details.',
      status: 'captured',
      category: newCategory.trim() || undefined,
      impact: newImpact,
      effort: newEffort,
      tags,
    });

    addToast({
      type: 'success',
      title: 'Spark Captured',
      message: `"${newTitle}" added to Captured column.`,
    });

    setNewTitle('');
    setNewDesc('');
    setNewTagsInput('');
    setIsCaptureModalOpen(false);
  };

  const handleOpenPromote = (idea: Idea) => {
    setSelectedPromoteIdea(idea);
    setIsPromoteModalOpen(true);
  };

  const handleDelete = async (idea: Idea) => {
    await deleteIdea(idea.id);
    addToast({
      type: 'error',
      title: 'Idea Deleted',
      message: `"${idea.title}" was removed.`,
    });
  };

  return (
    <div className="pcc-ideas-page" id="ideas-page-root">
      {/* Header */}
      <div className="pcc-ideas__header">
        <div className="pcc-ideas__title-group">
          <h1>Idea Incubator & Sparks</h1>
        </div>
        <Button
          variant="primary"
          size="md"
          id="btn-capture-spark"
          icon={
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          }
          onClick={() => setIsCaptureModalOpen(true)}
        >
          Capture Spark
        </Button>
      </div>

      {/* Toolbar */}
      <div className="pcc-ideas__toolbar">
        <Input
          id="ideas-search-input"
          placeholder="Search ideas, sparks & tags..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ width: '280px' }}
          icon={
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          }
        />

        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {filteredIdeas.length} Sparks in pipeline
          </span>
        </div>
      </div>

      {/* 4 Status Columns */}
      <div className="pcc-ideas__columns-grid">
        {COLUMNS.map((col) => {
          const colIdeas = getColumnIdeas(col.id);

          return (
            <div key={col.id} className="pcc-ideas-column" id={`ideas-col-${col.id}`}>
              <div className="pcc-ideas-column__header">
                <div className="pcc-ideas-column__title-wrap">
                  <span className={cn('pcc-ideas-column__dot', col.dotClass)} />
                  <h3 className="pcc-ideas-column__title">{col.title}</h3>
                </div>
                <span className="pcc-ideas-column__count">{colIdeas.length}</span>
              </div>

              <div className="pcc-ideas-column__cards-list">
                {colIdeas.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: 'var(--space-8) var(--space-2)', color: 'var(--color-text-tertiary)', fontSize: 'var(--font-size-xs)' }}>
                    No items in {col.title}
                  </div>
                ) : (
                  colIdeas.map((idea) => {
                    const dropdownItems = [
                      {
                        id: 'promote',
                        label: 'Promote to Task / Project...',
                        icon: (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="5" y1="12" x2="19" y2="12" />
                            <polyline points="12 5 19 12 12 19" />
                          </svg>
                        ),
                        onClick: () => handleOpenPromote(idea),
                      },
                      {
                        id: 'to-exploring',
                        label: 'Move to Exploring',
                        disabled: idea.status === 'exploring',
                        onClick: () => moveIdeaStatus(idea.id, 'exploring'),
                      },
                      {
                        id: 'to-captured',
                        label: 'Move to Captured',
                        disabled: idea.status === 'captured',
                        onClick: () => moveIdeaStatus(idea.id, 'captured'),
                      },
                      {
                        id: 'to-archived',
                        label: 'Archive Idea',
                        disabled: idea.status === 'archived',
                        onClick: () => moveIdeaStatus(idea.id, 'archived'),
                      },
                      {
                        id: 'delete',
                        label: 'Delete Idea',
                        danger: true,
                        icon: (
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                        ),
                        onClick: () => handleDelete(idea),
                      },
                    ];

                    return (
                      <div key={idea.id} id={`idea-card-${idea.id}`} className="pcc-idea-card">
                        <div className="pcc-idea-card__header">
                          <h4 className="pcc-idea-card__title">{idea.title}</h4>
                          {idea.category && (
                            <Badge variant="default" size="sm">{idea.category}</Badge>
                          )}
                        </div>

                        <p className="pcc-idea-card__desc">{idea.description}</p>

                        {/* Impact & Effort matrix */}
                        <div className="pcc-idea-card__matrix-pills">
                          {idea.impact === 'high' && (
                            <span className="pcc-idea-card__pill pcc-idea-card__pill--high-impact">
                              High Impact
                            </span>
                          )}
                          {idea.effort === 'low' && (
                            <span className="pcc-idea-card__pill pcc-idea-card__pill--low-effort">
                              Low Effort (Quick Win)
                            </span>
                          )}
                          {idea.tags && idea.tags.map((t) => (
                            <span key={t} className="pcc-idea-card__pill">
                              #{t}
                            </span>
                          ))}
                        </div>

                        {/* Promoted Reference Badge */}
                        {idea.promotedTo && (
                          <div className="pcc-idea-card__promoted-link">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                              <polyline points="15 3 21 3 21 9" />
                              <line x1="10" y1="14" x2="21" y2="3" />
                            </svg>
                            <span>
                              Promoted to {idea.promotedTo.type === 'project' ? 'Project' : 'Task'}:{' '}
                              <strong>{idea.promotedTo.title}</strong>
                            </span>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="pcc-idea-card__actions">
                          {idea.status !== 'promoted' ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={
                                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                                </svg>
                              }
                              onClick={() => handleOpenPromote(idea)}
                            >
                              Promote &rarr;
                            </Button>
                          ) : (
                             <span style={{ fontSize: '11px', color: 'var(--color-success)', fontWeight: 'var(--font-weight-medium)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                               <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                 <polyline points="20 6 9 17 4 12" />
                               </svg>
                               Active in Workflow
                             </span>
                          )}

                          <Dropdown
                            id={`idea-menu-${idea.id}`}
                            trigger={
                              <button
                                type="button"
                                style={{
                                  padding: '4px 6px',
                                  color: 'var(--color-text-secondary)',
                                  borderRadius: 'var(--radius-xs)',
                                }}
                                aria-label="More idea actions"
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="1.5" />
                                  <circle cx="19" cy="12" r="1.5" />
                                  <circle cx="5" cy="12" r="1.5" />
                                </svg>
                              </button>
                            }
                            items={dropdownItems}
                          />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Capture Spark Modal */}
      <Modal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        title="Capture Fleeting Spark"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setIsCaptureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCaptureSubmit}>
              Save Spark
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCaptureSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            id="spark-title"
            label="Idea Concept *"
            placeholder="e.g. Automated Podcast Transcription pipeline..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="spark-desc">
              Context & Hypothesis
            </label>
            <textarea
              id="spark-desc"
              className="pcc-input__field"
              rows={3}
              placeholder="Why is this interesting? What problem does it solve?"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-3)' }}>
            <Input
              id="spark-category"
              label="Category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
            />

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="spark-impact">Impact</label>
              <select
                id="spark-impact"
                className="pcc-input__field"
                value={newImpact}
                onChange={(e) => setNewImpact(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="high">High Impact</option>
                <option value="medium">Medium Impact</option>
                <option value="low">Low Impact</option>
              </select>
            </div>

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="spark-effort">Effort</label>
              <select
                id="spark-effort"
                className="pcc-input__field"
                value={newEffort}
                onChange={(e) => setNewEffort(e.target.value as 'low' | 'medium' | 'high')}
              >
                <option value="low">Low (Quick Win)</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>

          <Input
            id="spark-tags"
            label="Tags (comma separated)"
            placeholder="AI, Audio, Automation"
            value={newTagsInput}
            onChange={(e) => setNewTagsInput(e.target.value)}
          />
        </form>
      </Modal>

      {/* Promote Idea Modal */}
      <PromoteIdeaModal
        idea={selectedPromoteIdea}
        isOpen={isPromoteModalOpen}
        onClose={() => {
          setIsPromoteModalOpen(false);
          setSelectedPromoteIdea(null);
        }}
      />
    </div>
  );
};

export default IdeasPage;
