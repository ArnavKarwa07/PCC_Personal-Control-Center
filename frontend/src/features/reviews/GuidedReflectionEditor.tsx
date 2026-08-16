import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Modal } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import type { Review, ReviewSection } from '../../types';

interface GuidedReflectionEditorProps {
  review: Review;
  onSaveEntry: (section: ReviewSection, content: string) => Promise<void>;
  onComplete: () => Promise<void>;
  onReopen: () => Promise<void>;
}

interface SectionConfig {
  id: ReviewSection;
  title: string;
  subtitle: string;
  icon: string;
  cssModifier: string;
  placeholder: string;
  prompts: string[];
}

const SECTIONS: SectionConfig[] = [
  {
    id: 'accomplishments',
    title: 'Accomplishments & Wins',
    subtitle: 'What went well? Major deliverables, milestones reached, and proud moments.',
    icon: '🌟',
    cssModifier: 'pcc-reflection-section--accomplishments',
    placeholder: '• Shipped the new analytics engine\n• Maintained 5-day workout streak\n• Resolved key architectural bottleneck...',
    prompts: [
      '🏆 Top Achievement: ',
      '🚀 Shipped Deliverable: ',
      '💪 Habit Streak: ',
      '✨ Personal Win: ',
    ],
  },
  {
    id: 'outstanding',
    title: 'Outstanding & Roadblocks',
    subtitle: "What didn't get finished? Identify bottlenecks, scope creeps, and energy drains.",
    icon: '⚠️',
    cssModifier: 'pcc-reflection-section--outstanding',
    placeholder: '• Delayed database migration due to schema edge cases\n• Context switching slowed down deep work...',
    prompts: [
      '⏳ Delayed Item: ',
      '🚧 Key Bottleneck: ',
      '⚡ Energy Drain: ',
      '🛑 Distraction Factor: ',
    ],
  },
  {
    id: 'reflection',
    title: 'Learnings & Insights',
    subtitle: 'What did you learn? System tweaks, behavioral discoveries, and strategic pivots.',
    icon: '💡',
    cssModifier: 'pcc-reflection-section--reflection',
    placeholder: '• Batching communications into 2 daily slots saved 90 mins\n• Break large PRs into smaller units earlier...',
    prompts: [
      '🧠 Core Lesson: ',
      '⚙️ Process Tweak: ',
      '🔄 What to Stop Doing: ',
      '📈 What to Double Down On: ',
    ],
  },
  {
    id: 'next_week',
    title: 'Next Period Focus & Commitments',
    subtitle: 'Top 3 priorities, non-negotiable milestones, and high-impact action commitments.',
    icon: '🎯',
    cssModifier: 'pcc-reflection-section--next_week',
    placeholder: '1. Complete Phase E deployment & smoke tests\n2. Run 3x 5k sessions\n3. Review investment allocation...',
    prompts: [
      '1️⃣ Priority 1 (Non-negotiable): ',
      '2️⃣ Priority 2 (Major Goal): ',
      '3️⃣ Priority 3 (Optimization): ',
      '🛡️ Recovery & Health Focus: ',
    ],
  },
];

export const GuidedReflectionEditor: React.FC<GuidedReflectionEditorProps> = ({
  review,
  onSaveEntry,
  onComplete,
  onReopen,
}) => {
  const { toast } = useToast();
  const [entriesContent, setEntriesContent] = useState<Record<ReviewSection, string>>({
    accomplishments: '',
    outstanding: '',
    reflection: '',
    next_week: '',
  });

  const [savingSection, setSavingSection] = useState<ReviewSection | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Sync entries from review prop
  useEffect(() => {
    const map: Record<ReviewSection, string> = {
      accomplishments: '',
      outstanding: '',
      reflection: '',
      next_week: '',
    };
    if (review.entries) {
      review.entries.forEach((e) => {
        if (e.section in map) {
          map[e.section] = e.content || '';
        }
      });
    }
    setEntriesContent(map);
  }, [review]);

  const handleContentChange = (section: ReviewSection, value: string) => {
    setEntriesContent((prev) => ({ ...prev, [section]: value }));
  };

  const handleBlur = async (section: ReviewSection) => {
    const current = entriesContent[section];
    const original = review.entries?.find((e) => e.section === section)?.content || '';
    if (current !== original) {
      setSavingSection(section);
      try {
        await onSaveEntry(section, current);
        toast.success(`Saved "${section}" reflection`);
      } catch (err) {
        toast.error(`Failed to save ${section}`);
      } finally {
        setSavingSection(null);
      }
    }
  };

  const handleInsertPrompt = (section: ReviewSection, prompt: string) => {
    setEntriesContent((prev) => {
      const existing = prev[section];
      const prefix = existing && !existing.endsWith('\n') ? '\n' : '';
      return {
        ...prev,
        [section]: `${existing}${prefix}${prompt}`,
      };
    });
  };

  const handleSaveAll = async () => {
    setSavingSection('accomplishments');
    try {
      for (const section of Object.keys(entriesContent) as ReviewSection[]) {
        await onSaveEntry(section, entriesContent[section]);
      }
      toast.success('All reflection sections saved successfully!');
    } catch (err) {
      toast.error('Failed to save all sections');
    } finally {
      setSavingSection(null);
    }
  };

  const handleToggleComplete = async () => {
    setCompleting(true);
    try {
      if (review.status === 'completed') {
        await onReopen();
        toast.info('Review reverted to draft status');
      } else {
        // Save first then complete
        for (const section of Object.keys(entriesContent) as ReviewSection[]) {
          await onSaveEntry(section, entriesContent[section]);
        }
        await onComplete();
        toast.success('🎉 Retrospective completed & recorded to your streak!');
      }
    } catch (err) {
      toast.error('Failed to update review status');
    } finally {
      setCompleting(false);
    }
  };

  const generateMarkdownSummary = (): string => {
    return `# Retrospective: ${review.week_start} to ${review.week_end}
**Status:** ${review.status.toUpperCase()} ${review.completed_at ? `(Completed: ${new Date(review.completed_at).toLocaleDateString()})` : ''}

## 🌟 Accomplishments & Wins
${entriesContent.accomplishments || '_None recorded_'}

## ⚠️ Outstanding & Roadblocks
${entriesContent.outstanding || '_None recorded_'}

## 💡 Learnings & Insights
${entriesContent.reflection || '_None recorded_'}

## 🎯 Next Period Focus & Commitments
${entriesContent.next_week || '_None recorded_'}

---
*Generated by PCC (Personal Control Center)*`;
  };

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(generateMarkdownSummary());
    toast.success('Retrospective Markdown copied to clipboard!');
  };

  return (
    <div className="pcc-reflection-workspace">
      <Card glass padding="lg" className="pcc-reflection-editor-card">
        <div className="pcc-reflection-editor-header">
          <div className="pcc-reflection-editor-info">
            <div className="pcc-reflection-editor-title">
              <span>📅 {review.week_start} — {review.week_end}</span>
              <Badge variant={review.status === 'completed' ? 'success' : 'warning'}>
                {review.status === 'completed' ? '✓ Completed' : '✎ Draft'}
              </Badge>
            </div>
            <div className="pcc-reflection-editor-meta">
              <span>Created {new Date(review.created_at).toLocaleDateString()}</span>
              {review.completed_at && (
                <span>• Finished {new Date(review.completed_at).toLocaleString()}</span>
              )}
            </div>
          </div>

          <div className="pcc-reflection-editor-actions">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setExportModalOpen(true)}
            >
              📋 Export / Share
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveAll}
              disabled={savingSection !== null}
            >
              💾 Save All
            </Button>

            <Button
              size="sm"
              variant={review.status === 'completed' ? 'outline' : 'primary'}
              onClick={handleToggleComplete}
              loading={completing}
            >
              {review.status === 'completed' ? 'Reopen Draft' : 'Complete Review 🎉'}
            </Button>
          </div>
        </div>

        <div className="pcc-reflection-sections">
          {SECTIONS.map((sec) => {
            const content = entriesContent[sec.id] || '';
            const words = content.trim() ? content.trim().split(/\s+/).length : 0;
            const isSaving = savingSection === sec.id;

            return (
              <div key={sec.id} className={`pcc-reflection-section ${sec.cssModifier}`}>
                <div className="pcc-reflection-section__header">
                  <div className="pcc-reflection-section__title-group">
                    <span className="pcc-reflection-section__icon">{sec.icon}</span>
                    <div>
                      <h3 className="pcc-reflection-section__title">{sec.title}</h3>
                      <span className="pcc-reflection-section__prompt">{sec.subtitle}</span>
                    </div>
                  </div>

                  {isSaving && (
                    <Badge variant="primary" size="sm">
                      Saving...
                    </Badge>
                  )}
                </div>

                <div className="pcc-reflection-section__prompt-chips">
                  {sec.prompts.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      className="pcc-prompt-chip"
                      onClick={() => handleInsertPrompt(sec.id, p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <textarea
                  className="pcc-reflection-textarea"
                  value={content}
                  onChange={(e) => handleContentChange(sec.id, e.target.value)}
                  onBlur={() => handleBlur(sec.id)}
                  placeholder={sec.placeholder}
                  rows={4}
                />

                <div className="pcc-reflection-section__footer">
                  <span>Press Tab / click away to autosave</span>
                  <span className="pcc-reflection-stats-badge">
                    {words} {words === 1 ? 'word' : 'words'} • {content.length} chars
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Export / Share Modal */}
      <Modal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        title="Export Retrospective Summary"
        size="lg"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
            <Button variant="outline" onClick={handleCopyMarkdown}>
              📋 Copy Markdown
            </Button>
            <Button variant="primary" onClick={() => setExportModalOpen(false)}>
              Done
            </Button>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', margin: 0 }}>
            Share or archive your structured retrospective in clean Markdown format:
          </p>
          <pre className="pcc-review-summary-preview">{generateMarkdownSummary()}</pre>
        </div>
      </Modal>
    </div>
  );
};
