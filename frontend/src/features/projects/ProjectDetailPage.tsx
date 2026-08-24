import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useToast } from '../../hooks/useToast';
import { ProjectStatus, Priority } from '../../types';
import { Card, Badge, Button, Tabs, EmptyState, Input, Modal } from '../../components/ui';
import { formatDate } from '../../utils';
import './ProjectDetailPage.css';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { fetchProjects, getProjectById, updateProject, deleteProject } = useProjectStore();
  const { tasks, fetchTasks, addTask, toggleTaskComplete, deleteTask } = useTaskStore();
  const { addToast } = useToast();

  useEffect(() => {
    fetchProjects();
    fetchTasks();
  }, [fetchProjects, fetchTasks]);

  const [activeTab, setActiveTab] = useState<string>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  // Edit form state
  const project = id ? getProjectById(id) : undefined;
  const [editTitle, setEditTitle] = useState(project?.title || '');
  const [editDesc, setEditDesc] = useState(project?.description || '');
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project?.status || 'active');
  const [editPriority, setEditPriority] = useState<Priority>(project?.priority || 'medium');
  const [editDueDate, setEditDueDate] = useState(project?.dueDate || '');

  useEffect(() => {
    if (project) {
      setEditTitle(project.title);
      setEditDesc(project.description || '');
      setEditStatus(project.status);
      setEditPriority(project.priority || 'medium');
      setEditDueDate(project.dueDate || '');
    }
  }, [project]);

  // New task form state
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');

  if (!project) {
    return (
      <div className="pcc-project-detail">
        <EmptyState
          title="Project Not Found"
          description={`No project found with ID "${id}". It may have been removed.`}
          actionLabel="Back to Projects"
          onAction={() => navigate('/projects')}
        />
      </div>
    );
  }

  // Calculate project metrics
  const projectTasks = tasks.filter((t) => t.projectId === project.id);
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter((t) => t.status === 'completed').length;
  const inProgressTasks = projectTasks.filter((t) => t.status === 'in_progress').length;
  const todoTasks = projectTasks.filter((t) => t.status === 'todo').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : (project.progress || 0);

  const tabsConfig = [
    { id: 'overview', label: 'Overview' },
    { id: 'tasks', label: 'Tasks', count: totalTasks },
  ];

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    await updateProject(project.id, {
      title: editTitle.trim(),
      description: editDesc.trim() || undefined,
      status: editStatus,
      priority: editPriority,
      dueDate: editDueDate || undefined,
    });

    addToast({
      type: 'success',
      title: 'Project Updated',
      message: 'Project details have been saved.',
    });
    setIsEditModalOpen(false);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    await addTask({
      title: newTaskTitle.trim(),
      status: 'todo',
      columnId: 'todo',
      priority: newTaskPriority,
      projectId: project.id,
      projectName: project.title,
      dueDate: newTaskDueDate || undefined,
      subtasks: [],
      tags: [],
    });

    addToast({
      type: 'success',
      title: 'Task Created',
      message: `Task added to ${project.title}.`,
    });

    setNewTaskTitle('');
    setNewTaskDueDate('');
    setIsNewTaskModalOpen(false);
  };

  const handleDeleteProject = async () => {
    if (window.confirm(`Are you sure you want to delete "${project.title}"?`)) {
      await deleteProject(project.id);
      addToast({
        type: 'error',
        title: 'Project Deleted',
        message: `"${project.title}" has been deleted.`,
      });
      navigate('/projects');
    }
  };

  const getPriorityBadgeVariant = (p?: Priority) => {
    switch (p) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'accent';
      case 'low':
      default: return 'default';
    }
  };

  return (
    <div className="pcc-project-detail" id="project-detail-root">
      {/* Top Navigation & Breadcrumbs */}
      <div className="pcc-project-detail__nav-bar">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/projects')}
          icon={
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          }
        >
          Back to Projects
        </Button>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setEditTitle(project.title);
              setEditDesc(project.description || '');
              setEditStatus(project.status);
              setEditPriority(project.priority || 'medium');
              setEditDueDate(project.dueDate || '');
              setIsEditModalOpen(true);
            }}
          >
            Edit Project
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            }
            onClick={() => setIsNewTaskModalOpen(true)}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Project Header Banner */}
      <div className="pcc-project-detail__header-card">
        <div
          className="pcc-project-detail__accent-top"
          style={{ background: project.color || 'var(--color-accent-gradient)' }}
        />

        <div className="pcc-project-detail__header-content">
          <div className="pcc-project-detail__title-section">
            <div className="pcc-project-detail__badges">
              <Badge variant="accent">{project.status.toUpperCase()}</Badge>
              {project.priority && (
                <Badge variant={getPriorityBadgeVariant(project.priority)}>{project.priority.toUpperCase()}</Badge>
              )}
              {project.category && (
                <Badge variant="default">{project.category}</Badge>
              )}
            </div>

            <h1 className="pcc-project-detail__title">{project.title}</h1>

            <p className="pcc-project-detail__desc">
              {project.description || 'No description set for this project yet.'}
            </p>

            <div className="pcc-project-detail__meta-list">
              {project.dueDate && (
                <span className="pcc-project-detail__meta-item">
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                  </svg>
                  Target: {formatDate(project.dueDate)}
                </span>
              )}
              <span className="pcc-project-detail__meta-item">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                ID: {project.id}
              </span>
            </div>
          </div>

          {/* Progress Box Widget */}
          <div className="pcc-project-detail__progress-box">
            <div className="pcc-project-detail__progress-stats">
              <div>
                <span className="pcc-project-detail__progress-number">{progressPercent}%</span>
                <span className="pcc-project-detail__progress-label"> Complete</span>
              </div>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                {completedTasks}/{totalTasks} Tasks Done
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-full)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: project.color || 'var(--color-accent-gradient)',
                  transition: 'width var(--transition-slow)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
              <span>{todoTasks} To Do</span>
              <span>{inProgressTasks} In Progress</span>
              <span>{completedTasks} Done</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <Tabs
        tabs={tabsConfig}
        activeTab={activeTab}
        onChange={setActiveTab}
        id="project-detail-tabs"
      />

      {/* Tab Panels */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-4)' }}>
          <Card header={<h3>Initiative Overview</h3>} padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
                {project.description || 'No detailed scope configured.'}
              </p>

              <div style={{ marginTop: 'var(--space-2)' }}>
                <h4 style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 'var(--space-2)' }}>
                  Tags & Tech Stack
                </h4>
                <div style={{ display: 'flex', gap: 'var(--space-1)', flexWrap: 'wrap' }}>
                  {project.tags && project.tags.length > 0 ? (
                    project.tags.map((t) => (
                      <Badge key={t} variant="default" size="sm">
                        #{t}
                      </Badge>
                    ))
                  ) : (
                    <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>No tags</span>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card header={<h3>Work Breakdown Status</h3>} padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>To Do Backlog</span>
                <Badge variant="default">{todoTasks} items</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0', borderBottom: '1px solid var(--color-border)' }}>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>In Active Development</span>
                <Badge variant="accent">{inProgressTasks} items</Badge>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-2) 0' }}>
                <span style={{ fontSize: 'var(--font-size-sm)' }}>Completed & Verified</span>
                <Badge variant="success">{completedTasks} items</Badge>
              </div>

              <div style={{ marginTop: 'var(--space-4)', display: 'flex', gap: 'var(--space-2)' }}>
                <Button variant="secondary" size="sm" onClick={() => navigate('/tasks')}>
                  View Tasks &rarr;
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteProject}>
                  Delete Project
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>Tasks for {project.title}</h3>
            <Button
              variant="primary"
              size="sm"
              icon={
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
              }
              onClick={() => setIsNewTaskModalOpen(true)}
            >
              Add Task
            </Button>
          </div>

          {projectTasks.length === 0 ? (
            <EmptyState
              title="No Tasks in this Project"
              description="Create your first task to start tracking deliverables."
              actionLabel="Create Task"
              onAction={() => setIsNewTaskModalOpen(true)}
            />
          ) : (
            <div className="pcc-project-detail__tasks-list">
              {projectTasks.map((t) => {
                const isDone = t.status === 'completed';
                return (
                  <div key={t.id} className="pcc-project-detail__task-row">
                    <div className="pcc-project-detail__task-left">
                      <button
                        type="button"
                        className={`pcc-project-detail__task-checkbox ${
                          isDone ? 'pcc-project-detail__task-checkbox--checked' : ''
                        }`}
                        onClick={() => toggleTaskComplete(t.id)}
                        aria-label={`Toggle completion for ${t.title}`}
                      >
                        {isDone && (
                          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <span className={`pcc-project-detail__task-title ${isDone ? 'pcc-project-detail__task-title--completed' : ''}`}>
                        {t.title}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <Badge variant={getPriorityBadgeVariant(t.priority)} size="sm">
                        {t.priority}
                      </Badge>
                      {t.dueDate && (
                        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-tertiary)' }}>
                          {formatDate(t.dueDate)}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(t.id)}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Project Details"
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveEdit}>
              Save Changes
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSaveEdit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            id="edit-proj-title"
            label="Project Title"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
          />

          <div className="pcc-input-wrapper">
            <label className="pcc-input__label" htmlFor="edit-proj-desc">
              Description
            </label>
            <textarea
              id="edit-proj-desc"
              className="pcc-input__field"
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="edit-proj-status">Status</label>
              <select
                id="edit-proj-status"
                className="pcc-input__field"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
              >
                <option value="active">Active</option>
                <option value="planned">Planned</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="edit-proj-priority">Priority</label>
              <select
                id="edit-proj-priority"
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

          <Input
            id="edit-proj-due"
            type="date"
            label="Target Due Date"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
          />
        </form>
      </Modal>

      {/* New Task Modal */}
      <Modal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        title={`Add Task to ${project.title}`}
        size="md"
        footer={
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)' }}>
            <Button variant="ghost" onClick={() => setIsNewTaskModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateTask}>
              Create Task
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateTask} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          <Input
            id="new-task-proj-title"
            label="Task Title *"
            placeholder="e.g. Implement component..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
            <div className="pcc-input-wrapper">
              <label className="pcc-input__label" htmlFor="new-task-proj-priority">Priority</label>
              <select
                id="new-task-proj-priority"
                className="pcc-input__field"
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <Input
              id="new-task-proj-due"
              type="date"
              label="Due Date"
              value={newTaskDueDate}
              onChange={(e) => setNewTaskDueDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
