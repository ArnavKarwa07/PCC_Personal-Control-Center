import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Priority, TaskStatus, RecurrenceType } from '../../types';
import { Card, Badge, Button, Input, EmptyState, Modal } from '../../components/ui';
import { formatDate } from '../../utils';
import './Tasks.css';

export const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, updateTask, deleteTask, addSubtask, toggleSubtask, deleteSubtask } = useTaskStore();
  const { projects } = useProjectStore();
  const { addToast } = useToast();

  const task = id ? getTaskById(id) : undefined;

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // Edit form states
  const [editTitle, setEditTitle] = useState(task?.title || '');
  const [editDesc, setEditDesc] = useState(task?.description || '');
  const [editStatus, setEditStatus] = useState<TaskStatus>(task?.status || 'todo');
  const [editPriority, setEditPriority] = useState<Priority>(task?.priority || 'medium');
  const [editProjectId, setEditProjectId] = useState<string>(task?.projectId || '');
  const [editDueDate, setEditDueDate] = useState(task?.dueDate || '');
  const [editRecurrence, setEditRecurrence] = useState<RecurrenceType>(task?.recurrence || 'none');

  if (!task) {
    return (
      <div className="pcc-tasks-page">
        <EmptyState
          title="Task Not Found"
          description={`No task found with ID "${id}". It may have been deleted or moved.`}
          actionLabel="Back to Tasks"
          onAction={() => navigate('/tasks')}
        />
      </div>
    );
  }

  const handleToggleCompleted = async () => {
    const isCompleted = task.status === 'completed';
    const newStatus: TaskStatus = isCompleted ? 'todo' : 'completed';
    await updateTask(task.id, { status: newStatus });
    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `Task marked as ${newStatus}.`,
    });
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    const proj = projects.find((p) => p.id === editProjectId);

    await updateTask(task.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      status: editStatus,
      priority: editPriority,
      projectId: editProjectId || undefined,
      projectName: proj?.title,
      dueDate: editDueDate || undefined,
      recurrence: editRecurrence,
    });

    addToast({
      type: 'success',
      title: 'Task Updated',
      message: 'Changes saved successfully.',
    });
    setIsEditModalOpen(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
      await deleteTask(task.id);
      addToast({
        type: 'error',
        title: 'Task Deleted',
        message: 'Task removed from database.',
      });
      navigate('/tasks');
    }
  };

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskInput.trim()) return;
    addSubtask(task.id, newSubtaskInput.trim());
    setNewSubtaskInput('');
  };

  const subtasks = task.subtasks || [];
  const completedSubtasks = subtasks.filter((st) => st.completed).length;
  const subtasksProgress = subtasks.length > 0 ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'accent';
      case 'low':
      default: return 'default';
    }
  };

  return (
    <div className="pcc-tasks-page" id="task-detail-page-root">
      {/* Navigation Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/tasks')}
          icon={
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          }
        >
          Back to Tasks
        </Button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditTitle(task.title);
              setEditDesc(task.description || '');
              setEditStatus(task.status);
              setEditPriority(task.priority);
              setEditProjectId(task.projectId || '');
              setEditDueDate(task.dueDate || '');
              setEditRecurrence(task.recurrence || 'none');
              setIsEditModalOpen(true);
            }}
          >
            Edit Task
          </Button>
          <Button
            variant={task.status === 'completed' ? 'secondary' : 'primary'}
            size="sm"
            onClick={handleToggleCompleted}
          >
            {task.status === 'completed' ? 'Mark Incomplete' : 'Mark Completed'}
          </Button>
        </div>
      </div>

      {/* Main Task Card */}
      <Card glass padding="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
            <Badge variant={task.status === 'completed' ? 'success' : 'accent'}>
              {task.status.toUpperCase()}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(task.priority)}>
              {task.priority.toUpperCase()} PRIORITY
            </Badge>
            {task.recurrence && task.recurrence !== 'none' && (
              <Badge variant="default">
                REPEATS {task.recurrence.toUpperCase()}
              </Badge>
            )}
            {task.projectName && (
              <Badge variant="default">
                Project: {task.projectName}
              </Badge>
            )}
          </div>

          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)', margin: 0 }}>
            {task.title}
          </h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            {task.dueDate && <span>Target Due: {formatDate(task.dueDate)}</span>}
            <span>Created: {formatDate(task.createdAt)}</span>
            <span>Task ID: {task.id}</span>
          </div>

          {task.description && (
            <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
              <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 'var(--line-height-relaxed)' }}>
                {task.description}
              </p>
            </div>
          )}

          {/* Subtasks Checklist */}
          <div style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>
                Subtasks Checklist ({completedSubtasks}/{subtasks.length})
              </h3>
              {subtasks.length > 0 && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-accent)' }}>
                  {subtasksProgress}% completed
                </span>
              )}
            </div>

            {subtasks.length > 0 && (
              <div style={{ width: '100%', height: '6px', background: 'var(--color-bg-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
                <div style={{ width: `${subtasksProgress}%`, height: '100%', background: 'var(--color-accent-gradient)', transition: 'width 0.3s ease' }} />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              {subtasks.map((st) => (
                <div
                  key={st.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2) var(--space-3)',
                    background: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <input
                      type="checkbox"
                      checked={st.completed}
                      onChange={() => toggleSubtask(task.id, st.id)}
                      style={{ accentColor: 'var(--color-accent)', width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 'var(--font-size-sm)', textDecoration: st.completed ? 'line-through' : 'none', color: st.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}>
                      {st.title}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSubtask(task.id, st.id)}
                    style={{ color: 'var(--color-text-tertiary)', cursor: 'pointer', padding: '2px 6px' }}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>

            {/* Add subtask */}
            <form onSubmit={handleAddSubtaskSubmit} style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
              <Input
                id="page-subtask-input"
                placeholder="Add executable checklist item..."
                value={newSubtaskInput}
                onChange={(e) => setNewSubtaskInput(e.target.value)}
              />
              <Button variant="secondary" size="md" type="submit" disabled={!newSubtaskInput.trim()}>
                Add
              </Button>
            </form>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-4)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
            <Button variant="danger" size="sm" onClick={handleDelete}>
              Delete Task
            </Button>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Task"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            id="page-edit-title"
            label="Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="page-edit-desc">Description</label>
            <textarea
              id="page-edit-desc"
              className="pcc-input__field"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="page-edit-status">Status</label>
              <select
                id="page-edit-status"
                className="pcc-input__field"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as TaskStatus)}
              >
                <option value="todo">To Do</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="page-edit-priority">Priority</label>
              <select
                id="page-edit-priority"
                className="pcc-input__field"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value as Priority)}
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
              id="page-edit-due"
              type="date"
              label="Due Date"
              value={editDueDate}
              onChange={(e) => setEditDueDate(e.target.value)}
            />

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="page-edit-recurrence">Recurrence</label>
              <select
                id="page-edit-recurrence"
                className="pcc-input__field"
                value={editRecurrence}
                onChange={(e) => setEditRecurrence(e.target.value as RecurrenceType)}
              >
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TaskDetailPage;
