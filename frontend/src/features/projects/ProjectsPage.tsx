import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '../../stores/projectStore';
import { useTaskStore } from '../../stores/taskStore';
import { useToast } from '../../hooks/useToast';
import { Project, ProjectStatus, Priority } from '../../types';
import { Card, Badge, Button, Input, Tabs, EmptyState, Dropdown } from '../../components/ui';
import { CreateProjectModal } from './CreateProjectModal';
import { formatDate } from '../../utils';
import './ProjectsPage.css';

export const ProjectsPage: React.FC = () => {
  const navigate = useNavigate();
  const { projects, updateProject, deleteProject } = useProjectStore();
  const { tasks } = useTaskStore();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);

  // Compute stats
  const activeCount = projects.filter((p) => p.status === 'active').length;
  const plannedCount = projects.filter((p) => p.status === 'planned').length;
  const completedCount = projects.filter((p) => p.status === 'completed').length;
  const archivedCount = projects.filter((p) => p.status === 'archived').length;

  // Filter tabs
  const tabItems = [
    { id: 'all', label: 'All Projects', count: projects.length },
    { id: 'active', label: 'Active', count: activeCount },
    { id: 'planned', label: 'Planned', count: plannedCount },
    { id: 'completed', label: 'Completed', count: completedCount },
    { id: 'archived', label: 'Archived', count: archivedCount },
  ];

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // Filtered projects for standard grid view
  const filteredProjects = projects.filter((p) => {
    // Status filter
    if (activeTab !== 'all' && p.status !== activeTab) {
      return false;
    }
    // Priority filter
    if (priorityFilter !== 'all' && p.priority !== priorityFilter) {
      return false;
    }
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      const matchCategory = p.category?.toLowerCase().includes(q);
      const matchTag = p.tags?.some((t) => t.toLowerCase().includes(q));
      return matchTitle || matchDesc || matchCategory || matchTag;
    }
    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case 'active':
        return <Badge variant="accent" size="sm">Active</Badge>;
      case 'planned':
        return <Badge variant="info" size="sm">Planned</Badge>;
      case 'completed':
        return <Badge variant="success" size="sm">Completed</Badge>;
      case 'archived':
        return <Badge variant="default" size="sm">Archived</Badge>;
      case 'on_hold':
      default:
        return <Badge variant="warning" size="sm">On Hold</Badge>;
    }
  };

  const getPriorityBadge = (priority?: Priority) => {
    if (!priority) return null;
    switch (priority) {
      case 'urgent':
        return <Badge variant="error" size="sm">Urgent</Badge>;
      case 'high':
        return <Badge variant="warning" size="sm">High</Badge>;
      case 'medium':
        return <Badge variant="accent" size="sm">Medium</Badge>;
      case 'low':
      default:
        return <Badge variant="default" size="sm">Low</Badge>;
    }
  };

  const handleMarkComplete = async (project: Project) => {
    const newStatus: ProjectStatus = project.status === 'completed' ? 'active' : 'completed';
    const newProgress = newStatus === 'completed' ? 100 : project.progress;
    await updateProject(project.id, { status: newStatus, progress: newProgress });
    addToast({
      type: 'success',
      title: 'Project Updated',
      message: `"${project.title}" marked as ${newStatus}.`,
    });
  };

  const handleArchive = async (project: Project) => {
    await updateProject(project.id, { status: 'archived' });
    addToast({
      type: 'info',
      title: 'Project Archived',
      message: `"${project.title}" has been archived.`,
    });
  };

  const handleDelete = async (project: Project) => {
    await deleteProject(project.id);
    addToast({
      type: 'error',
      title: 'Project Deleted',
      message: `"${project.title}" was deleted.`,
    });
  };

  return (
    <div className="pcc-projects-page" id="projects-page-root">
      {/* Page Header */}
      <div className="pcc-projects__header">
        <div className="pcc-projects__title-group">
          <h1>Projects & Initiatives</h1>
        </div>
        <Button
          variant="primary"
          size="md"
          id="btn-create-project"
          icon={
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          }
          onClick={() => setIsCreateModalOpen(true)}
        >
          New Project
        </Button>
      </div>

      {/* Stats Summary Bar */}
      <div className="pcc-projects__stats-bar">
        <div className="pcc-projects__stat-card">
          <div className="pcc-projects__stat-icon pcc-projects__stat-icon--active">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div className="pcc-projects__stat-info">
            <span className="pcc-projects__stat-value">{activeCount}</span>
            <span className="pcc-projects__stat-label">Active Initiatives</span>
          </div>
        </div>

        <div className="pcc-projects__stat-card">
          <div className="pcc-projects__stat-icon pcc-projects__stat-icon--planned">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="pcc-projects__stat-info">
            <span className="pcc-projects__stat-value">{plannedCount}</span>
            <span className="pcc-projects__stat-label">Planned Roadmap</span>
          </div>
        </div>

        <div className="pcc-projects__stat-card">
          <div className="pcc-projects__stat-icon pcc-projects__stat-icon--completed">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="pcc-projects__stat-info">
            <span className="pcc-projects__stat-value">{completedCount}</span>
            <span className="pcc-projects__stat-label">Completed Milestones</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="pcc-projects__controls">
        <div className="pcc-projects__tabs-wrapper">
          <Tabs
            tabs={tabItems}
            activeTab={activeTab}
            onChange={handleTabChange}
            id="projects-status-tabs"
          />
        </div>

        <div className="pcc-projects__filters-row">
          <Input
            id="projects-search-input"
            placeholder="Search projects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            className="pcc-projects__search-input"
            icon={
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            }
          />

          <select
            id="projects-priority-filter"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="pcc-projects__priority-select"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          id="projects-empty-state"
          title="No projects found"
          description={
            searchQuery
              ? `No projects matching "${searchQuery}". Try clearing search.`
              : 'You do not have any projects in this view yet.'
          }
          actionLabel="Create Project"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="pcc-projects__grid" id="projects-grid">
          {filteredProjects.map((project) => {
            // Count project tasks
            const projTasks = tasks.filter((t) => t.projectId === project.id);
            const totalTasks = projTasks.length || project.tasksCount || 0;
            const doneTasks = projTasks.filter((t) => t.status === 'completed').length || project.completedTasksCount || 0;
            const progressPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : (project.progress || 0);

            const dropdownItems = [
              {
                id: 'view',
                label: 'View Project Details',
                icon: (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ),
                onClick: () => navigate(`/projects/${project.id}`),
              },
              {
                id: 'complete',
                label: project.status === 'completed' ? 'Reopen Project' : 'Mark as Completed',
                icon: (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                ),
                onClick: () => handleMarkComplete(project),
              },
              {
                id: 'archive',
                label: 'Archive Project',
                icon: (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="21 8 21 21 3 21 3 8" />
                    <rect x="1" y="3" width="22" height="5" />
                    <line x1="10" y1="12" x2="14" y2="12" />
                  </svg>
                ),
                onClick: () => handleArchive(project),
              },
              {
                id: 'delete',
                label: 'Delete Project',
                danger: true,
                icon: (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                ),
                onClick: () => handleDelete(project),
              },
            ];

            return (
              <Card
                key={project.id}
                id={`project-card-${project.id}`}
                hoverable
                padding="lg"
                className="pcc-project-card"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                {/* Accent Color Strip */}
                <div
                  className="pcc-project-card__accent-bar"
                  style={{ background: project.color || 'var(--color-accent-gradient)' }}
                />

                {/* Top Row: Category label + Priority badge + Status badge (flex, space-between) */}
                <div className="pcc-project-card__header">
                  <span className="pcc-project-card__category">
                    {project.category || 'Initiative'}
                  </span>
                  <div className="pcc-project-card__badges">
                    {getPriorityBadge(project.priority)}
                    {getStatusBadge(project.status)}
                  </div>
                </div>

                {/* Project Title (prominent, font-weight 600) */}
                <h3 className="pcc-project-card__title">{project.title}</h3>

                {/* Progress bar */}
                <div className="pcc-project-card__progress-container">
                  <div className="pcc-project-card__progress-header">
                    <span>
                      {doneTasks}/{totalTasks} tasks completed
                    </span>
                    <span style={{ fontWeight: 'var(--font-weight-semibold)', color: 'var(--color-text-primary)' }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="pcc-project-card__progress-track">
                    <div
                      className="pcc-project-card__progress-fill"
                      style={{
                        width: `${progressPct}%`,
                        background: project.color || 'var(--color-accent-gradient)',
                      }}
                    />
                  </div>
                </div>

                {/* Card Footer: Due date + 3-dot action menu */}
                <div className="pcc-project-card__footer" onClick={(e) => e.stopPropagation()}>
                  <div className="pcc-project-card__deadline">
                    {project.dueDate ? (
                      <>
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                        </svg>
                        <span>Due {formatDate(project.dueDate)}</span>
                      </>
                    ) : (
                      <span>No deadline</span>
                    )}
                  </div>

                  <div className="pcc-project-card__actions">
                    <Dropdown
                      id={`project-dropdown-${project.id}`}
                      trigger={
                        <button
                          type="button"
                          className="pcc-project-card__action-btn"
                          aria-label="Project actions"
                        >
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
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
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
};

export default ProjectsPage;

