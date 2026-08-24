import React, { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Priority, ProjectStatus } from '../../types';
import { Modal, Input, Button } from '../../components/ui';

export interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_PRESETS = ['#6366f1', '#8b5cf6', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4'];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addProject } = useProjectStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [dueDate, setDueDate] = useState('');
  const [category, setCategory] = useState('Engineering');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Project title is required');
      return;
    }

    setLoading(true);
    setError('');

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await addProject({
        title: title.trim(),
        name: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        category: category.trim() || undefined,
        tags,
        color,
        progress: 0,
      });

      addToast({
        type: 'success',
        title: 'Project Created',
        message: `"${title}" was successfully created.`,
      });

      // Reset form
      setTitle('');
      setDescription('');
      setPriority('medium');
      setStatus('active');
      setDueDate('');
      setCategory('Engineering');
      setTagsInput('');
      setColor('#6366f1');
      onClose();
    } catch {
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Project"
      size="md"
      id="create-project-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Project
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <Input
          id="new-project-title"
          label="Project Title *"
          placeholder="e.g. Personal Control Center (PCC)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error}
          autoFocus
        />

        <div className="pcc-input-wrapper">
          <label className="pcc-input__label" htmlFor="new-project-desc">
            Description
          </label>
          <textarea
            id="new-project-desc"
            className="pcc-input__field"
            rows={3}
            placeholder="Brief vision, deliverables, or objectives..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={{ resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="new-project-status">
              Initial Status
            </label>
            <select
              id="new-project-status"
              className="pcc-input__field"
              value={status}
              onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            >
              <option value="active">Active</option>
              <option value="planned">Planned</option>
              <option value="on_hold">On Hold</option>
            </select>
          </div>

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="new-project-priority">
              Priority
            </label>
            <select
              id="new-project-priority"
              className="pcc-input__field"
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            id="new-project-due"
            type="date"
            label="Target Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <Input
            id="new-project-cat"
            label="Category"
            placeholder="e.g. Engineering, Career"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>

        <Input
          id="new-project-tags"
          label="Tags (comma separated)"
          placeholder="React, TypeScript, AI"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />

        {/* Color Presets */}
        <div>
          <label className="pcc-input__label" style={{ marginBottom: 'var(--space-2)', display: 'block' }}>
            Accent Color Theme
          </label>
          <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  background: c,
                  border: color === c ? '2px solid #ffffff' : '2px solid transparent',
                  boxShadow: color === c ? `0 0 10px ${c}` : 'none',
                  cursor: 'pointer',
                  transition: 'transform var(--transition-fast)',
                }}
              />
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};
