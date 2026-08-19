import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTaskStore } from '../../stores/taskStore';
import { useProjectStore } from '../../stores/projectStore';
import { useToast } from '../../hooks/useToast';
import { Task, Priority } from '../../types';
import { Badge, Button, Input, EmptyState, Dropdown } from '../../components/ui';
import { TaskDetailModal } from './TaskDetailModal';
import { CreateTaskModal } from './CreateTaskModal';
import { KanbanBoard } from '../projects/KanbanBoard';
import { formatDate, cn } from '../../utils';
import './Tasks.css';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks,
    viewMode,
    filterStatus,
    filterPriority,
    filterDueDate,
    searchQuery,
    toggleTaskComplete,
    deleteTask,
    setViewMode,
    setFilterStatus,
    setFilterPriority,
    setFilterDueDate,
    setSearchQuery,
  } = useTaskStore();

  const { projects } = useProjectStore();
  const { addToast } = useToast();

  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Compute stats
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter((t) => t.status === 'todo').length;

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    // Status filter
    if (filterStatus === 'pending' && task.status === 'completed') return false;
    if (filterStatus === 'completed' && task.status !== 'completed') return false;
    if (filterStatus === 'in_progress' && task.status !== 'in_progress') return false;

    // Priority filter
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;

    // Due Date filter
    if (filterDueDate === 'today' && task.dueDate !== '2026-08-15') return false;
    if (filterDueDate === 'overdue' && task.dueDate && task.dueDate < '2026-08-15' && task.status !== 'completed') return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = task.title.toLowerCase().includes(q);
      const matchDesc = task.description?.toLowerCase().includes(q);
      const matchProj = task.projectName?.toLowerCase().includes(q);
      const matchTag = task.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchProj || matchTag;
    }

    return true;
  });

  const getPriorityBadgeVariant = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'accent';
      case 'low':
      default: return 'default';
    }
  };

  const getRecurrenceLabel = (rec?: string) => {
    if (!rec || rec === 'none') return null;
    return (
      <span className="pcc-task-item__recurrence-icon" title={`Repeats ${rec}`}>
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14" />
          <polyline points="7 23 3 19 7 15" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" />
        </svg>
      </span>
    );
  };

  const handleOpenDetail = (task: Task) => {
    setSelectedTask(task);
    setIsDetailModalOpen(true);
  };

  const handleDelete = async (task: Task) => {
    await deleteTask(task.id);
    addToast({
      type: 'error',
      title: 'Task Deleted',
      message: `"${task.title}" was removed.`,
    });
  };

  // Rendering Task Item
  const renderTaskItem = (task: Task) => {
    const isCompleted = task.status === 'completed';
    const totalSubtasks = task.subtasks?.length || 0;
    const completedSubtasks = task.subtasks?.filter((st) => st.completed).length || 0;

    const dropdownItems = [
      {
        id: 'edit',
        label: 'Open & Edit Details',
        icon: (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        ),
        onClick: () => handleOpenDetail(task),
      },
      {
        id: 'view-page',
        label: 'Go to Task Page',
        onClick: () => navigate(`/tasks/${task.id}`),
      },
      {
        id: 'delete',
        label: 'Delete Task',
        danger: true,
        icon: (
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        ),
        onClick: () => handleDelete(task),
      },
    ];

    return (
      <div
        key={task.id}
        id={`task-item-${task.id}`}
        className={cn('pcc-task-item', isCompleted && 'pcc-task-item--completed')}
      >
        <div className="pcc-task-item__left">
          {/* Animated Checkbox */}
          <button
            type="button"
            className={cn(
              'pcc-task-checkbox',
              isCompleted && 'pcc-task-checkbox--checked'
            )}
            onClick={() => toggleTaskComplete(task.id)}
            aria-label={`Mark "${task.title}" as ${isCompleted ? 'incomplete' : 'completed'}`}
          >
            {isCompleted && (
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </button>

          <div className="pcc-task-item__info">
            <div className="pcc-task-item__title-row">
              <span
                className={cn(
                  'pcc-task-item__title',
                  isCompleted && 'pcc-task-item__title--done'
                )}
                onClick={() => handleOpenDetail(task)}
              >
                {task.title}
              </span>
              {getRecurrenceLabel(task.recurrence)}
            </div>

            <div className="pcc-task-item__meta-row">
              {task.projectName && (
                <span style={{ color: 'var(--color-text-secondary)' }}>
                  {task.projectName}
                </span>
              )}
              {totalSubtasks > 0 && (
                <span>
                  &bull; {completedSubtasks}/{totalSubtasks} subtasks
                </span>
              )}
              {task.dueDate && (
                <span
                  className={cn(
                    'pcc-task-item__due-badge',
                    task.dueDate === '2026-08-15'
                      ? 'pcc-task-item__due-badge--today'
                      : task.dueDate < '2026-08-15' && !isCompleted
                      ? 'pcc-task-item__due-badge--overdue'
                      : 'pcc-task-item__due-badge--future'
                  )}
                >
                  &bull; Due {formatDate(task.dueDate)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="pcc-task-item__right">
          <Badge variant={getPriorityBadgeVariant(task.priority)} size="sm">
            {task.priority}
          </Badge>

          <div className="pcc-task-item__actions">
            <button
              type="button"
              className="pcc-task-item__action-btn"
              title="Edit Task Details"
              aria-label={`Edit ${task.title}`}
              onClick={() => handleOpenDetail(task)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <button
              type="button"
              className="pcc-task-item__action-btn pcc-task-item__action-btn--danger"
              title="Delete Task"
              aria-label={`Delete ${task.title}`}
              onClick={() => handleDelete(task)}
            >
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
            <Dropdown
              id={`task-menu-${task.id}`}
              trigger={
                <button
                  type="button"
                  className="pcc-task-item__action-btn"
                  aria-label="More task options"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="1.5" />
                    <circle cx="19" cy="12" r="1.5" />
                    <circle cx="5" cy="12" r="1.5" />
                  </svg>
                </button>
              }
              items={dropdownItems}
            />
          </div>
        </div>
      </div>
    );
  };

  // Group by Project
  const renderGroupByProject = () => {
    const projectMap: Record<string, Task[]> = {};
    const unassignedTasks: Task[] = [];

    filteredTasks.forEach((task) => {
      if (task.projectId) {
        if (!projectMap[task.projectId]) projectMap[task.projectId] = [];
        projectMap[task.projectId].push(task);
      } else {
        unassignedTasks.push(task);
      }
    });

    return (
      <div className="pcc-tasks-container">
        {Object.entries(projectMap).map(([projId, projTasks]) => {
          const proj = projects.find((p) => p.id === projId);
          return (
            <div key={projId} className="pcc-tasks-group">
              <div className="pcc-tasks-group__header">
                <h3 className="pcc-tasks-group__title">
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: proj?.color || 'var(--color-accent)' }} />
                  {proj?.title || projTasks[0]?.projectName || 'Project'} ({projTasks.length})
                </h3>
              </div>
              {projTasks.map(renderTaskItem)}
            </div>
          );
        })}

        {unassignedTasks.length > 0 && (
          <div className="pcc-tasks-group">
            <div className="pcc-tasks-group__header">
              <h3 className="pcc-tasks-group__title">
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-text-tertiary)' }} />
                Standalone / Unassigned ({unassignedTasks.length})
              </h3>
            </div>
            {unassignedTasks.map(renderTaskItem)}
          </div>
        )}
      </div>
    );
  };

  // Group by Priority
  const renderGroupByPriority = () => {
    const priorities: Priority[] = ['urgent', 'high', 'medium', 'low'];

    return (
      <div className="pcc-tasks-container">
        {priorities.map((p) => {
          const pTasks = filteredTasks.filter((t) => t.priority === p);
          if (pTasks.length === 0) return null;

          return (
            <div key={p} className="pcc-tasks-group">
              <div className="pcc-tasks-group__header">
                <h3 className="pcc-tasks-group__title">
                  <Badge variant={getPriorityBadgeVariant(p)} size="sm">{p.toUpperCase()}</Badge>
                  <span>Priority ({pTasks.length})</span>
                </h3>
              </div>
              {pTasks.map(renderTaskItem)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="pcc-tasks-page" id="tasks-page-root">
      {/* Header */}
      <div className="pcc-tasks__header">
        <div className="pcc-tasks__title-group">
          <h1>Tasks & Action Items</h1>
          <p>Accelerate execution, track checklists, and manage recurring productivity routines.</p>
        </div>
        <Button
          variant="primary"
          size="md"
          id="btn-create-task"
          icon={
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Task
        </Button>
      </div>

      {/* Stats Bar */}
      <div className="pcc-tasks__stats-bar">
        <div className="pcc-tasks__stat-card">
          <span className="pcc-tasks__stat-val">{totalTasks}</span>
          <span className="pcc-tasks__stat-label">Total Pipeline</span>
        </div>
        <div className="pcc-tasks__stat-card">
          <span className="pcc-tasks__stat-val" style={{ color: 'var(--color-accent)' }}>{inProgressTasks}</span>
          <span className="pcc-tasks__stat-label">In Progress</span>
        </div>
        <div className="pcc-tasks__stat-card">
          <span className="pcc-tasks__stat-val" style={{ color: 'var(--color-success)' }}>{completedTasks}</span>
          <span className="pcc-tasks__stat-label">Completed</span>
        </div>
        <div className="pcc-tasks__stat-card">
          <span className="pcc-tasks__stat-val" style={{ color: 'var(--color-warning)' }}>{pendingTasks}</span>
          <span className="pcc-tasks__stat-label">Pending Backlog</span>
        </div>
      </div>

      {/* Filter & View Mode Bar */}
      <div className="pcc-tasks__filter-bar">
        <div className="pcc-tasks__filter-left">
          <Input
            id="tasks-search"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            style={{ width: '180px' }}
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pcc-tasks__filter-select"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="pcc-tasks__filter-select"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterDueDate}
            onChange={(e) => setFilterDueDate(e.target.value)}
            className="pcc-tasks__filter-select"
          >
            <option value="all">All Dates</option>
            <option value="today">Due Today</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>

        <div className="pcc-tasks__filter-right">
          {/* View Mode Switcher */}
          <div className="pcc-tasks-view-modes">
            <button
              type="button"
              className={cn(
                'pcc-tasks-view-btn',
                viewMode === 'list' && 'pcc-tasks-view-btn--active'
              )}
              onClick={() => setViewMode('list')}
            >
              List View
            </button>
            <button
              type="button"
              className={cn(
                'pcc-tasks-view-btn',
                viewMode === 'kanban' && 'pcc-tasks-view-btn--active'
              )}
              onClick={() => setViewMode('kanban')}
            >
              Kanban Board
            </button>
            <button
              type="button"
              className={cn(
                'pcc-tasks-view-btn',
                viewMode === 'project' && 'pcc-tasks-view-btn--active'
              )}
              onClick={() => setViewMode('project')}
            >
              By Project
            </button>
            <button
              type="button"
              className={cn(
                'pcc-tasks-view-btn',
                viewMode === 'priority' && 'pcc-tasks-view-btn--active'
              )}
              onClick={() => setViewMode('priority')}
            >
              By Priority
            </button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      {filteredTasks.length === 0 ? (
        <EmptyState
          id="tasks-empty-state"
          title="No Tasks Found"
          description={
            searchQuery
              ? `No action items match "${searchQuery}".`
              : 'Your task queue is currently empty in this filter.'
          }
          actionLabel="Create Task"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : viewMode === 'kanban' ? (
        <KanbanBoard globalMode onCardClick={handleOpenDetail} />
      ) : viewMode === 'project' ? (
        renderGroupByProject()
      ) : viewMode === 'priority' ? (
        renderGroupByPriority()
      ) : (
        <div className="pcc-tasks-container">
          {filteredTasks.map(renderTaskItem)}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedTask(null);
        }}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default TasksPage;
