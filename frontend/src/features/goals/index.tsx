import React, { useState } from 'react';
import { Card, Button, Badge, Input } from '../../components/ui';
import { useToast } from '../../hooks/useToast';
import './GoalsPage.css';

export const GoalsPage: React.FC = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState([
    {
      id: '1',
      title: 'Architect Personal Control Center OS',
      period: 'Q3 2026',
      progress: 85,
      status: 'In Progress',
      milestones: ['Design Glassmorphic Token System', 'FastAPI Deduplication', 'Stitch UI Redesign'],
    },
    {
      id: '2',
      title: 'Master Distributed Consensus & Raft Protocols',
      period: 'Q4 2026',
      progress: 40,
      status: 'In Progress',
      milestones: ['Implement Raft Leader Election', 'Log Replication Engine'],
    },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newPeriod, setNewPeriod] = useState('Q3 2026');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;

    const newG = {
      id: String(Date.now()),
      title: newTitle,
      period: newPeriod,
      progress: 0,
      status: 'In Progress',
      milestones: ['Initial Objective Setup'],
    };

    setGoals([newG, ...goals]);
    toast.success(`Created OKR Goal: "${newTitle}"`);
    setNewTitle('');
  };

  const handleUpdateProgress = (id: string, delta: number) => {
    setGoals(
      goals.map((g) => {
        if (g.id === id) {
          const next = Math.min(100, Math.max(0, g.progress + delta));
          return { ...g, progress: next, status: next === 100 ? 'Completed' : 'In Progress' };
        }
        return g;
      })
    );
    toast.info(`Updated goal progress`);
  };

  return (
    <div className="pcc-goals-page">
      <div className="pcc-goals-header">
        <div>
          <h1 className="pcc-goals-title">Goals & OKRs Matrix</h1>
          <p className="pcc-goals-subtitle">Strategic objectives, key results, milestone trees, and skill progression</p>
        </div>
      </div>

      <div className="pcc-goals-grid">
        <div className="pcc-goals-list">
          {goals.map((g) => (
            <Card key={g.id} glass padding="lg" className="pcc-goal-card">
              <div className="pcc-goal-card__header">
                <div>
                  <h3 className="pcc-goal-card__title">{g.title}</h3>
                  <span className="pcc-goal-card__period">{g.period} Objective</span>
                </div>
                <Badge variant={g.status === 'Completed' ? 'success' : 'primary'}>{g.status}</Badge>
              </div>

              <div className="pcc-goal-card__progress">
                <div className="pcc-goal-card__progress-info">
                  <span>Target Completion:</span>
                  <strong>{g.progress}%</strong>
                </div>
                <div className="pcc-progress-bar">
                  <div className="pcc-progress-bar__fill" style={{ width: `${g.progress}%` }} />
                </div>
              </div>

              <div className="pcc-goal-card__key-results">
                <span className="pcc-milestones-label">Key Results & Checkpoints:</span>
                <div className="pcc-key-results-list">
                  {g.milestones.map((m, idx) => (
                    <label key={idx} className="pcc-key-result-item">
                      <input
                        type="checkbox"
                        className="pcc-key-result-checkbox"
                        defaultChecked={g.progress === 100 || idx === 0}
                      />
                      <span className="pcc-key-result-text">{m}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pcc-goal-card__actions">
                <Button size="sm" variant="outline" onClick={() => handleUpdateProgress(g.id, -10)}>-10%</Button>
                <Button size="sm" variant="outline" onClick={() => handleUpdateProgress(g.id, 10)}>+10% Progress</Button>
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
                id="goal-period"
                label="Target Time Period"
                value={newPeriod}
                onChange={(e) => setNewPeriod(e.target.value)}
              />
              <Button type="submit" variant="primary">Create Objective</Button>
            </form>
          </Card>

          <Card glass padding="lg" className="pcc-skills-matrix-card">
            <h2>Skill Trees Matrix</h2>
            <div className="pcc-skills-list">
              <div className="pcc-skill-item">
                <span>FastAPI & Python 3.12</span>
                <Badge variant="success">Expert</Badge>
              </div>
              <div className="pcc-skill-item">
                <span>React 18 & TypeScript</span>
                <Badge variant="success">Master</Badge>
              </div>
              <div className="pcc-skill-item">
                <span>Glassmorphic Micro-Interactions</span>
                <Badge variant="primary">Advanced</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GoalsPage;
