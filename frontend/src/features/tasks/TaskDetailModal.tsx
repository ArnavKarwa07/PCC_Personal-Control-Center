import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Task, Priority, TaskStatus, RecurrenceType } from '../../types';
import { Modal, Input, Button } from '../../components/ui';

export interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const { updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const { projects } = useProjectStore();
  const { addToast } = useToast();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('todo');
  const [priority, setPriority] = useState<Priority>('medium');
  const [projectId, setProjectId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setProjectId(task.projectId || '');
      setDueDate(task.dueDate || '');
      setRecurrence(task.recurrence || 'none');
    }
  }, [task]);

  if (!task) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const selectedProj = projects.find((p) => p.id === projectId);

    await updateTask(task.id, {
      title: title.trim(),
      description: description.trim() || undefined,
      status,
      priority,
      projectId: projectId || undefined,
      projectName: selectedProj?.title,
      dueDate: dueDate || undefined,
      recurrence,
    });

    addToast({
      type: 'success',
      title: 'Task Saved',
      message: `"${title}" has been updated.`,
    });
    onClose();
  };

  const handleDelete = async () => {
    if (window.confirm(`Delete "${task.title}"?`)) {
      await deleteTask(task.id);
      addToast({
        type: 'error',
        title: 'Task Deleted',
        message: `Task removed.`,
      });
      onClose();
    }
  };

  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    addSubtask(task.id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtasksProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Task Details & Execution"
      size="md"
      id="task-detail-modal"
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
          <Button variant="danger" size="sm" onClick={handleDelete}>
            Delete Task
          </Button>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save Task
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        <Input
          id="task-title-input"
          label="Task Title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="pcc-input-wrapper">
          <label className="pcc-input__label" htmlFor="task-desc-input">
            Description & Acceptance Criteria
          </label>
          <textarea
            id="task-desc-input"
            className="pcc-input__field"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Key notes, URLs, or sub-deliverables..."
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="task-status-select">Status</label>
            <select
              id="task-status-select"
              className="pcc-input__field"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="task-priority-select">Priority</label>
            <select
              id="task-priority-select"
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
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="task-project-select">Project</label>
            <select
              id="task-project-select"
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

          {/* Recurrence Selector */}
          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="task-recurrence-select">
              Recurrence Schedule
            </label>
            <select
              id="task-recurrence-select"
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
          id="task-due-date-input"
          type="date"
          label="Due Date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />

        {/* Subtasks Checklist Section */}
        <div className="pcc-subtasks-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
              Subtasks Checklist ({completedSubtasks}/{subtasks.length})
            </span>
            {subtasks.length > 0 && (
              <span style={{ fontSize: '11px', color: 'var(--color-accent)' }}>
                {subtasksProgress}% done
              </span>
            )}
          </div>

          {subtasks.length > 0 && (
            <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-primary)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
              <div style={{ width: `${subtasksProgress}%`, height: '100%', background: 'var(--color-accent)' }} />
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '140px', overflowY: 'auto' }}>
            {subtasks.map((st) => (
              <div key={st.id} className="pcc-subtask-row">
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => toggleSubtask(task.id, st.id)}
                  style={{ accentColor: 'var(--color-accent)', cursor: 'pointer' }}
                />
                <span className={`pcc-subtask-title ${st.completed ? 'pcc-subtask-title--done' : ''}`}>
                  {st.title}
                </span>
                <button
                  type="button"
                  onClick={() => deleteSubtask(task.id, st.id)}
                  style={{ color: 'var(--color-text-tertiary)', fontSize: '14px', padding: '0 4px' }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>

          {/* Add subtask inline input */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
            <input
              type="text"
              placeholder="Add new subtask..."
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask(e);
                }
              }}
              style={{
                flex: 1,
                padding: '4px 8px',
                fontSize: 'var(--font-size-xs)',
                background: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-xs)',
                color: 'var(--color-text-primary)',
              }}
            />
            <Button variant="secondary" size="sm" onClick={handleAddSubtask} disabled={!newSubtaskTitle.trim()}>
              + Add
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
