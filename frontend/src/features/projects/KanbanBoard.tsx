import React, { useState } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Task, KanbanColumnId, Priority } from '../../types';
import { Badge, Button, Input } from '../../components/ui';
import { formatDate, cn } from '../../utils';
import './KanbanBoard.css';

interface KanbanColumnConfig {
  id: KanbanColumnId;
  title: string;
  dotClass: string;
}

const COLUMNS: KanbanColumnConfig[] = [
  { id: 'todo', title: 'To Do', dotClass: 'pcc-kanban__column-dot--todo' },
  { id: 'in_progress', title: 'In Progress', dotClass: 'pcc-kanban__column-dot--in_progress' },
  { id: 'waiting', title: 'Waiting', dotClass: 'pcc-kanban__column-dot--waiting' },
  { id: 'done', title: 'Done', dotClass: 'pcc-kanban__column-dot--done' },
];

export interface KanbanBoardProps {
  projectId?: string;
  onCardClick?: (task: Task) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId,
  onCardClick,
}) => {
  const { tasks, moveTaskColumn, addTask } = useTaskStore();
  const { projects } = useProjectStore();
  const { addToast } = useToast();

  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<KanbanColumnId | null>(null);
  const [activeAddCol, setActiveAddCol] = useState<KanbanColumnId | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [newCardPriority, setNewCardPriority] = useState<Priority>('medium');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (projectId && t.projectId !== projectId) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const getColumnTasks = (colId: KanbanColumnId): Task[] => {
    return filteredTasks.filter((t) => {
      if (t.columnId) return t.columnId === colId;
      // Fallback mapping if columnId not set
      if (colId === 'done') return t.status === 'completed';
      if (colId === 'in_progress') return t.status === 'in_progress';
      if (colId === 'todo') return t.status === 'todo';
      return false;
    });
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, colId: KanbanColumnId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCol !== colId) {
      setDragOverCol(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetCol: KanbanColumnId) => {
    e.preventDefault();
    setDragOverCol(null);
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (!taskId) return;

    await moveTaskColumn(taskId, targetCol);
    setDraggedTaskId(null);
    addToast({
      type: 'info',
      title: 'Card Moved',
      message: `Card moved to ${targetCol.replace('_', ' ').toUpperCase()}`,
      duration: 3000,
    });
  };

  // Quick Move
  const handleQuickMove = async (taskId: string, targetCol: KanbanColumnId, e: React.MouseEvent) => {
    e.stopPropagation();
    await moveTaskColumn(taskId, targetCol);
    addToast({
      type: 'info',
      title: 'Card Moved',
      message: `Card moved to ${targetCol.replace('_', ' ').toUpperCase()}`,
      duration: 3000,
    });
  };

  // Inline Card Add
  const handleAddCardSubmit = async (colId: KanbanColumnId) => {
    if (!newCardTitle.trim()) return;

    let targetProjectId = projectId;
    let targetProjectName = undefined;

    if (projectId) {
      const proj = projects.find((p) => p.id === projectId);
      targetProjectName = proj?.title;
    }

    await addTask({
      title: newCardTitle.trim(),
      status: colId === 'done' ? 'completed' : colId === 'in_progress' ? 'in_progress' : 'todo',
      columnId: colId,
      priority: newCardPriority,
      projectId: targetProjectId,
      projectName: targetProjectName,
      subtasks: [],
      tags: [],
    });

    addToast({
      type: 'success',
      title: 'Task Created',
      message: `Added new card in ${colId.replace('_', ' ')}`,
      duration: 3000,
    });

    setNewCardTitle('');
    setActiveAddCol(null);
  };

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'accent';
      case 'low':
      default:
        return 'default';
    }
  };

  return (
    <div className="pcc-kanban" id="kanban-board-root">
      {/* Board Controls */}
      <div className="pcc-kanban__toolbar">
        <div className="pcc-kanban__toolbar-left">
          <Input
            id="kanban-search"
            placeholder="Search cards in board..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '260px' }}
            icon={
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />
        </div>
        <div className="pcc-kanban__toolbar-right">
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
            Showing {filteredTasks.length} cards
          </span>
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="pcc-kanban__columns">
        {COLUMNS.map((col) => {
          const colTasks = getColumnTasks(col.id);
          const isDragOver = dragOverCol === col.id;
          const isAdding = activeAddCol === col.id;

          return (
            <div
              key={col.id}
              id={`kanban-col-${col.id}`}
              className={cn(
                'pcc-kanban__column',
                isDragOver && 'pcc-kanban__column--dragover'
              )}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="pcc-kanban__column-header">
                <div className="pcc-kanban__column-title-group">
                  <span className={cn('pcc-kanban__column-dot', col.dotClass)} />
                  <h3 className="pcc-kanban__column-title">{col.title}</h3>
                </div>
                <span className="pcc-kanban__column-count">{colTasks.length}</span>
              </div>

              {/* Cards List */}
              <div className="pcc-kanban__card-list">
                {colTasks.length === 0 && !isAdding && (
                  <div
                    style={{
                      padding: 'var(--space-6) var(--space-2)',
                      textAlign: 'center',
                      color: 'var(--color-text-tertiary)',
                      fontSize: 'var(--font-size-xs)',
                    }}
                  >
                    No cards in {col.title}
                  </div>
                )}

                {colTasks.map((task) => {
                  const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;
                  const totalSubtasks = task.subtasks?.length || 0;
                  const isDragging = draggedTaskId === task.id;

                  return (
                    <div
                      key={task.id}
                      id={`kanban-card-${task.id}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onCardClick?.(task)}
                      className={cn(
                        'pcc-kanban-card',
                        isDragging && 'pcc-kanban-card--dragging'
                      )}
                    >
                      <div className="pcc-kanban-card__header">
                        <h4 className="pcc-kanban-card__title">{task.title}</h4>
                        <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
                          {task.priority}
                        </Badge>
                      </div>

                      {task.description && (
                        <p className="pcc-kanban-card__description">{task.description}</p>
                      )}

                      <div className="pcc-kanban-card__meta">
                        <div className="pcc-kanban-card__tags">
                          {!projectId && task.projectName && (
                            <span className="pcc-kanban-card__project-badge" title={task.projectName}>
                              {task.projectName}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="pcc-kanban-card__due" title={`Due ${formatDate(task.dueDate)}`}>
                              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                              </svg>
                              {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>

                        {totalSubtasks > 0 && (
                          <span className="pcc-kanban-card__subtasks-count">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="9 11 12 14 22 4" />
                              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                            </svg>
                            {completedSubtasks}/{totalSubtasks}
                          </span>
                        )}
                      </div>

                      {/* Quick Move Buttons */}
                      <div className="pcc-kanban-card__actions">
                        {col.id === 'todo' && (
                          <button
                            type="button"
                            className="pcc-kanban-card__move-btn"
                            onClick={(e) => handleQuickMove(task.id, 'in_progress', e)}
                            title="Move to In Progress"
                          >
                            &rarr; In Progress
                          </button>
                        )}
                        {col.id === 'in_progress' && (
                          <>
                            <button
                              type="button"
                              className="pcc-kanban-card__move-btn"
                              onClick={(e) => handleQuickMove(task.id, 'waiting', e)}
                              title="Move to Waiting"
                            >
                              &rarr; Wait
                            </button>
                            <button
                              type="button"
                              className="pcc-kanban-card__move-btn"
                              onClick={(e) => handleQuickMove(task.id, 'done', e)}
                              title="Move to Done"
                            >
                              &rarr; Done
                            </button>
                          </>
                        )}
                        {col.id === 'waiting' && (
                          <>
                            <button
                              type="button"
                              className="pcc-kanban-card__move-btn"
                              onClick={(e) => handleQuickMove(task.id, 'in_progress', e)}
                              title="Move to In Progress"
                            >
                              &rarr; In Progress
                            </button>
                            <button
                              type="button"
                              className="pcc-kanban-card__move-btn"
                              onClick={(e) => handleQuickMove(task.id, 'done', e)}
                              title="Move to Done"
                            >
                              &rarr; Done
                            </button>
                          </>
                        )}
                        {col.id === 'done' && (
                          <button
                            type="button"
                            className="pcc-kanban-card__move-btn"
                            onClick={(e) => handleQuickMove(task.id, 'todo', e)}
                            title="Reopen card to To Do"
                          >
                            &larr; Reopen
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Inline Add Card Trigger / Form */}
              {isAdding ? (
                <div className="pcc-kanban__add-form">
                  <textarea
                    className="pcc-kanban__add-textarea"
                    placeholder="Enter card title..."
                    value={newCardTitle}
                    autoFocus
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddCardSubmit(col.id);
                      } else if (e.key === 'Escape') {
                        setActiveAddCol(null);
                      }
                    }}
                  />
                  <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center' }}>
                    <label style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}>Priority:</label>
                    <select
                      value={newCardPriority}
                      onChange={(e) => setNewCardPriority(e.target.value as Priority)}
                      style={{
                        background: 'var(--color-bg-secondary)',
                        color: 'var(--color-text-primary)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 'var(--radius-xs)',
                        padding: '2px 6px',
                        fontSize: '11px',
                      }}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div className="pcc-kanban__add-buttons">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setActiveAddCol(null);
                        setNewCardTitle('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddCardSubmit(col.id)}
                      disabled={!newCardTitle.trim()}
                    >
                      Add Card
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="pcc-kanban__add-trigger">
                  <Button
                    variant="ghost"
                    size="sm"
                    fullWidth
                    icon={
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    }
                    onClick={() => {
                      setActiveAddCol(col.id);
                      setNewCardTitle('');
                    }}
                  >
                    Add Card
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
