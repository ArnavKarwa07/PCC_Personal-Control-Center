import React, { useState } from 'react';
import { Card, Button, Badge } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { OKRProgressRing } from '../../components/OKRProgressRing';
import { EditGoalModal, Goal } from './EditGoalModal';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSaveGoal = (savedGoal: Goal) => {
    setGoals((prev) => {
      const exists = prev.some((g) => g.id === savedGoal.id);
      if (exists) {
        toast.success(`Updated Goal: "${savedGoal.title}"`);
        return prev.map((g) => (g.id === savedGoal.id ? savedGoal : g));
      } else {
        toast.success(`Created OKR Goal: "${savedGoal.title}"`);
        return [savedGoal, ...prev];
      }
    });
    handleCloseModal();
  };

  const handleDeleteGoal = (goalId: string, title: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    toast.info(`Deleted Goal: "${title}"`);
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

  return (
    <div className="pcc-goals-page">
      <div className="pcc-goals-header">
        <div className="pcc-goals-header__main">
          <h1 className="pcc-goals-title">Goals & OKRs Matrix</h1>
          <p className="pcc-goals-subtitle">Strategic objectives, key results, and milestone progression</p>
        </div>
        <Button
          variant="primary"
          className="pcc-add-objective-btn"
          onClick={handleOpenAddModal}
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Objective
        </Button>
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
                        onClick={() => handleOpenEditModal(g)}
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
      </div>

      <EditGoalModal
        isOpen={isModalOpen}
        goal={editingGoal}
        onClose={handleCloseModal}
        onSave={handleSaveGoal}
      />
    </div>
  );
};

export default GoalsPage;

