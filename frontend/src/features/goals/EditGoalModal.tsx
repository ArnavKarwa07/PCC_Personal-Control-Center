import React, { useState, useEffect } from 'react';
import { Modal, Input, Button } from '../../components/ui';

export interface Milestone {
  id: string;
  text: string;
  completed: boolean;
}

export interface Goal {
  id: string;
  title: string;
  period: string;
  progress: number;
  status: 'In Progress' | 'Completed';
  milestones: Milestone[];
}

interface EditGoalModalProps {
  isOpen: boolean;
  goal: Goal | null;
  onClose: () => void;
  onSave: (updatedGoal: Goal) => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  goal,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'Completed'>('In Progress');
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  const isEdit = Boolean(goal);

  useEffect(() => {
    if (isOpen) {
      if (goal) {
        setTitle(goal.title);
        setPeriod(goal.period);
        setStatus(goal.status);
        setMilestones(goal.milestones ? [...goal.milestones] : []);
      } else {
        setTitle('');
        setPeriod(new Date().toISOString().split('T')[0]);
        setStatus('In Progress');
        setMilestones([{ id: `${Date.now()}-0`, text: '', completed: false }]);
      }
    }
  }, [goal, isOpen]);

  if (!isOpen) return null;

  const handleAddMilestone = () => {
    setMilestones([
      ...milestones,
      {
        id: `${Date.now()}-${milestones.length}`,
        text: '',
        completed: false,
      },
    ]);
  };

  const handleRemoveMilestone = (id: string) => {
    setMilestones(milestones.filter((m) => m.id !== id));
  };

  const handleMilestoneTextChange = (id: string, text: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, text } : m))
    );
  };

  const handleMilestoneToggle = (id: string) => {
    setMilestones(
      milestones.map((m) => (m.id === id ? { ...m, completed: !m.completed } : m))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const validMilestones = milestones
      .filter((m) => m.text.trim() !== '')
      .map((m) => ({ ...m, text: m.text.trim() }));

    const total = validMilestones.length;
    const completed = validMilestones.filter((m) => m.completed).length;
    const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

    const goalToSave: Goal = {
      id: goal ? goal.id : String(Date.now()),
      title: title.trim(),
      period: period || new Date().toISOString().split('T')[0],
      status: progress === 100 ? 'Completed' : status,
      progress,
      milestones: validMilestones,
    };

    onSave(goalToSave);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Objective / OKR' : 'Add Objective / OKR'}
      size="md"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Create Objective'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <Input
          id="goal-modal-title"
          label="Objective Name"
          placeholder="e.g. Master Rust Concurrency"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <Input
          id="goal-modal-period"
          type="date"
          label="Target Date"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          required
        />

        {isEdit && (
          <div className="pcc-reminder-form__group">
            <label className="pcc-reminder-form__label" htmlFor="goal-modal-status">
              Status
            </label>
            <select
              id="goal-modal-status"
              className="pcc-reminder-form__select"
              value={status}
              onChange={(e) => setStatus(e.target.value as 'In Progress' | 'Completed')}
            >
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        )}

        <div className="pcc-checkpoint-group">
          <label className="pcc-checkpoint-label">Key Results & Checkpoints</label>
          <div className="pcc-checkpoint-list">
            {milestones.map((m) => (
              <div key={m.id} className="pcc-checkpoint-row" style={{ display: 'flex', opacity: 1, alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={m.completed}
                  onChange={() => handleMilestoneToggle(m.id)}
                  title="Toggle checkpoint completion"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={m.text}
                  placeholder="Checkpoint description"
                  onChange={(e) => handleMilestoneTextChange(m.id, e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="pcc-checkpoint-remove"
                  onClick={() => handleRemoveMilestone(m.id)}
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
              onClick={handleAddMilestone}
              style={{ marginTop: '8px' }}
            >
              + Add Checkpoint
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

