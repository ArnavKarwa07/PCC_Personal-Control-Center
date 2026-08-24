import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Spinner } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import { OKRProgressRing } from '../../components/OKRProgressRing';
import { EditGoalModal, Goal } from './EditGoalModal';
import { goalsApi } from '../../services/api';
import './GoalsPage.css';

export const GoalsPage: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const mapBackendGoalToFrontend = (g: any): Goal => ({
    id: String(g.id),
    title: g.title || g.name || 'Untitled Goal',
    period: g.period || g.target_date || g.time_period || 'Q3 2026',
    progress: typeof g.progress === 'number' ? g.progress : 0,
    status: g.status === 'completed' || g.status === 'Completed' ? 'Completed' : 'In Progress',
    milestones: Array.isArray(g.milestones)
      ? g.milestones.map((m: any, idx: number) => ({
          id: String(m.id || idx),
          text: typeof m === 'string' ? m : m.name || m.text || m.title || 'Milestone',
          completed: Boolean(m.completed || m.completed_at || m.completedAt),
        }))
      : [],
  });

  const fetchGoals = async () => {
    setIsLoading(true);
    try {
      const res = await goalsApi.getAll();
      const rawData = (res as any)?.data || (Array.isArray(res) ? res : []);
      if (Array.isArray(rawData)) {
        setGoals(rawData.map(mapBackendGoalToFrontend));
      }
    } catch {
      // Keep empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

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

  const handleSaveGoal = async (savedGoal: Goal) => {
    const payload = {
      name: savedGoal.title,
      time_period: savedGoal.period,
      status: savedGoal.status === 'Completed' ? 'completed' : 'in_progress',
      progress: savedGoal.progress,
      milestones: savedGoal.milestones.map((m) => ({
        name: m.text,
        completed: m.completed,
      })),
    };

    try {
      const exists = goals.some((g) => g.id === savedGoal.id);
      if (exists) {
        const updateRes = await goalsApi.update(savedGoal.id, payload as any).catch(() => null);
        const updatedGoalObj = updateRes?.data ? mapBackendGoalToFrontend(updateRes.data) : savedGoal;
        setGoals((prev) => prev.map((g) => (g.id === savedGoal.id ? updatedGoalObj : g)));
        toast.success(`Updated Goal: "${savedGoal.title}"`);
      } else {
        const createRes = await goalsApi.create(payload as any).catch(() => null);
        const createdGoalObj = createRes?.data ? mapBackendGoalToFrontend(createRes.data) : savedGoal;
        setGoals((prev) => [createdGoalObj, ...prev]);
        toast.success(`Created OKR Goal: "${savedGoal.title}"`);
      }
    } catch {
      setGoals((prev) => {
        const exists = prev.some((g) => g.id === savedGoal.id);
        return exists ? prev.map((g) => (g.id === savedGoal.id ? savedGoal : g)) : [savedGoal, ...prev];
      });
    }
    handleCloseModal();
  };

  const handleDeleteGoal = async (goalId: string, title: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      await goalsApi.delete(goalId).catch(() => {});
    } catch {
      // Optimistic delete
    }
    toast.info(`Deleted Goal: "${title}"`);
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    let updatedGoal: Goal | null = null;
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
        updatedGoal = {
          ...g,
          milestones: updatedMilestones,
          progress,
          status,
        };
        return updatedGoal;
      })
    );

    if (updatedGoal) {
      const g: Goal = updatedGoal;
      try {
        await goalsApi.update(goalId, {
          progress: g.progress,
          status: g.status === 'Completed' ? 'completed' : 'in_progress',
          milestones: g.milestones.map((m) => ({ name: m.text, completed: m.completed })),
        } as any).catch(() => {});
      } catch {
        // ignore
      }
    }
    toast.info('Updated milestone status');
  };

  return (
    <div className="pcc-goals-page">
      <div className="pcc-goals-header">
        <div className="pcc-goals-header__main">
          <h1 className="pcc-goals-title">OKRs</h1>
        </div>
        <Button
          variant="primary"
          className="pcc-add-objective-btn"
          onClick={handleOpenAddModal}
          icon={
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
        >
          Add Objective
        </Button>
      </div>

      <div className="pcc-goals-grid">
        <div className="pcc-goals-list">
          {isLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '4rem 0' }}>
              <Spinner size="md" />
            </div>
          ) : goals.length === 0 ? (
            <Card glass padding="lg" className="pcc-goal-empty-card">
              <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
                <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.5, marginBottom: '0.75rem' }}>
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
                <h3 style={{ margin: '0 0 0.5rem 0', fontWeight: 600 }}>No Objectives or OKRs Yet</h3>
                <p style={{ margin: '0 0 1.5rem 0', color: 'var(--text-muted, #888)', fontSize: '0.9rem' }}>
                  Define strategic focus areas and track quarterly milestones with visual progress rings.
                </p>
                <Button variant="primary" onClick={handleOpenAddModal}>
                  + Set Your First OKR Goal
                </Button>
              </div>
            </Card>
          ) : (
            goals.map((g) => (
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
            ))
          )}
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
