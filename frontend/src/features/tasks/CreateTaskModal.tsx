import React, { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Priority, RecurrenceType } from '../../types';
import { Modal, Input, Button } from '../../components/ui';

export interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('2026-08-16');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [tagsInput, setTagsInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const selectedProj = projects.find((p) => p.id === projectId);
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      await addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status: 'todo',
        columnId: 'todo',
        priority,
        projectId: projectId || undefined,
        projectName: selectedProj?.title,
        dueDate: dueDate || undefined,
        recurrence,
        tags,
        subtasks: [],
      });

      addToast({
        type: 'success',
        title: 'Task Created',
        message: `"${title}" was added to your task list.`,
      });

      // Reset
      setTitle('');
      setDescription('');
      setPriority('medium');
      setProjectId('');
      setRecurrence('none');
      setTagsInput('');
      onClose();
    } catch {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Could not create task. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Action Item"
      size="md"
      id="create-task-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Task
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input
          id="new-task-title"
          label="Task Title *"
          placeholder="e.g. Implement React Router navigation..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
          required
        />

        <div className="pcc-input-wrapper">
          <label className="pcc-input__label" htmlFor="new-task-desc">
            Notes & Details
          </label>
          <textarea
            id="new-task-desc"
            className="pcc-input__field"
            rows={2}
            placeholder="Context, requirements, links..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="new-task-priority">Priority</label>
            <select
              id="new-task-priority"
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

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="new-task-project">Project</label>
            <select
              id="new-task-project"
              className="pcc-input__field"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="">No Project (Standalone)</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <Input
            id="new-task-due"
            type="date"
            label="Due Date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="new-task-recurrence">Recurrence</label>
            <select
              id="new-task-recurrence"
              className="pcc-input__field"
              value={recurrence}
              onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
            >
              <option value="none">None (One-time)</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>

        <Input
          id="new-task-tags"
          label="Tags (comma separated)"
          placeholder="Frontend, Review, UI"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
        />
      </form>
    </Modal>
  );
};
