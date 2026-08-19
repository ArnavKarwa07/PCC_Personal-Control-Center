import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { OKRProgressRing } from '../../components/OKRProgressRing';
import { EditGoalModal, Goal, Milestone } from './EditGoalModal';
import './GoalsPage.css';

export const GoalsPage: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Architect Personal Control Center OS',
      period: '2026-09-30',
      progress: 67,
      status: 'In Progress',
      milestones: [
        { id: '1-1', text: 'Design Glassmorphic Token System', completed: true },
        { id: '1-2', text: 'FastAPI Deduplication', completed: true },
        { id: '1-3', text: 'Stitch UI Redesign', completed: false },
      ],
    },
    {
      id: '2',
      title: 'Master Distributed Consensus & Raft Protocols',
      period: '2026-12-31',
      progress: 50,
      status: 'In Progress',
      milestones: [
        { id: '2-1', text: 'Implement Raft Leader Election', completed: true },
        { id: '2-2', text: 'Log Replication Engine', completed: false },
      ],
    },
  ]);

  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [checkpoints, setCheckpoints] = useState<string[]>(['']);

  const handleSaveGoal = (updatedGoal: Goal) => {
    setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
    toast.success(`Updated Goal: "${updatedGoal.title}"`);
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    toast.info(`Deleted Goal: "${title}"`);
  };

  const handleAddCheckpoint = () => {
    setCheckpoints([...checkpoints, '']);
  };

  const handleRemoveCheckpoint = (index: number) => {
    if (checkpoints.length === 1) {
      setCheckpoints(['']);
    } else {
      setCheckpoints(checkpoints.filter((_, i) => i !== index));
    }
  };

  const handleCheckpointChange = (index: number, value: string) => {
    const updated = [...checkpoints];
    updated[index] = value;
    setCheckpoints(updated);
  };

  const handleToggleMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== goalId) return g;
        const updatedMilestones = g.milestones.map((m) =>
          m.id === milestoneId ? { ...m, completed: !m.completed } : m
        );
        const totalMilestones = updatedMilestones.length;
        const completedMilestones = updatedMilestones.filter((m) => m.completed).length;
        const progress = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);
        const status: 'In Progress' | 'Completed' = progress === 100 ? 'Completed' : 'In Progress';
        return {
          ...g,
          milestones: updatedMilestones,
          progress,
          status,
        };
      })
    );
    toast.info('Updated milestone status');
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const validCheckpoints = checkpoints.map((cp) => cp.trim()).filter(Boolean);
    const newMilestones: Milestone[] =
      validCheckpoints.length > 0
        ? validCheckpoints.map((text, idx) => ({
            id: `${Date.now()}-${idx}`,
            text,
            completed: false,
          }))
        : [
            {
              id: `${Date.now()}-0`,
              text: 'Initial Objective Setup',
              completed: false,
            },
          ];

    const totalMilestones = newMilestones.length;
    const completedMilestones = newMilestones.filter((m) => m.completed).length;
    const progress = totalMilestones === 0 ? 0 : Math.round((completedMilestones / totalMilestones) * 100);

    const newG: Goal = {
      id: String(Date.now()),
      title: newTitle.trim(),
      period: newTargetDate || new Date().toISOString().split('T')[0],
      progress,
      status: progress === 100 ? 'Completed' : 'In Progress',
      milestones: newMilestones,
    };

    setGoals([newG, ...goals]);
    toast.success(`Created OKR Goal: "${newTitle.trim()}"`);
    setNewTitle('');
    setNewTargetDate('');
    setCheckpoints(['']);
  };

  return (
    <div className="pcc-goals-page">
      <div className="pcc-goals-header">
        <div>
          <h1 className="pcc-goals-title">Goals & OKRs Matrix</h1>
          <p className="pcc-goals-subtitle">Strategic objectives, key results, and milestone progression</p>
        </div>
      </div>

      <div className="pcc-goals-grid">
        <div className="pcc-goals-list">
          {goals.map((g) => (
            <Card key={g.id} glass padding="lg" className="pcc-goal-card">
              <div className="pcc-goal-card__top">
                <OKRProgressRing progress={g.progress} status={g.status} size={88} strokeWidth={8} />
                <div className="pcc-goal-card__meta">
                  <div className="pcc-goal-card__header">
                    <div>
                      <h3 className="pcc-goal-card__title">{g.title}</h3>
                      <span className="pcc-goal-card__period">Target: {g.period}</span>
                    </div>
                    <div className="pcc-goal-card__actions">
                      <Badge variant={g.status === 'Completed' ? 'success' : 'primary'}>{g.status}</Badge>
                      <button
                        type="button"
                        className="pcc-goal-action-btn"
                        onClick={() => setEditingGoal(g)}
                        title="Edit Goal"
                        aria-label="Edit Goal"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        className="pcc-goal-action-btn pcc-goal-action-btn--delete"
                        onClick={() => handleDeleteGoal(g.id, g.title)}
                        title="Delete Goal"
                        aria-label="Delete Goal"
                      >
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pcc-goal-card__key-results">
                <span className="pcc-milestones-label">Key Results & Checkpoints:</span>
                <div className="pcc-key-results-list">
                  {g.milestones.map((m) => (
                    <label key={m.id} className="pcc-key-result-item">
                      <input
                        type="checkbox"
                        className="pcc-key-result-checkbox"
                        checked={m.completed}
                        onChange={() => handleToggleMilestone(g.id, m.id)}
                      />
                      <span className={`pcc-key-result-text ${m.completed ? 'pcc-key-result-text--completed' : ''}`}>
                        {m.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="pcc-goals-sidebar">
          <Card glass padding="lg" className="pcc-add-goal-card">
            <h2>Add Objective / OKR</h2>
            <form onSubmit={handleAddGoal} className="pcc-add-goal-form">
              <Input
                id="goal-title"
                label="Objective Name"
                placeholder="e.g. Master Rust Concurrency"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
              />
              <Input
                id="goal-target-date"
                type="date"
                label="Target Date"
                value={newTargetDate}
                onChange={(e) => setNewTargetDate(e.target.value)}
                required
              />
              <div className="pcc-checkpoint-group">
                <label className="pcc-checkpoint-label">Checkpoints</label>
                <div className="pcc-checkpoint-list">
                  {checkpoints.map((cp, idx) => (
                    <div key={idx} className="pcc-checkpoint-row">
                      <input
                        type="text"
                        value={cp}
                        placeholder="Checkpoint description"
                        onChange={(e) => handleCheckpointChange(idx, e.target.value)}
                      />
                      <button
                        type="button"
                        className="pcc-checkpoint-remove"
                        onClick={() => handleRemoveCheckpoint(idx)}
                        aria-label="Remove checkpoint"
                        title="Remove checkpoint"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="pcc-checkpoint-add"
                    onClick={handleAddCheckpoint}
                  >
                    + Add Checkpoint
                  </button>
                </div>
              </div>
              <Button type="submit" variant="primary">
                Create Objective
              </Button>
            </form>
          </Card>
        </div>
      </div>

      <EditGoalModal
        isOpen={editingGoal !== null}
        goal={editingGoal}
        onClose={() => setEditingGoal(null)}
        onSave={handleSaveGoal}
      />
    </div>
  );
};

export default GoalsPage;
