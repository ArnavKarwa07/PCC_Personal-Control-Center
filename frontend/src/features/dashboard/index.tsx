import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Badge, Spinner } from '../../components/ui';
import { apiClient } from '../../services/api';
import './DashboardPage.css';

interface DailyBriefingData {
  date_str?: string;
  greeting?: string;
  pending_tasks_count?: number;
  upcoming_events_count?: number;
  overdue_reminders_count?: number;
  active_projects_count?: number;
  unread_notifications_count?: number;
  executive_summary?: string;
  focus_recommendation?: string;
  bullet_points?: string[];
}

const DEFAULT_BRIEFING: DailyBriefingData = {
  date_str: new Date().toISOString().split('T')[0],
  greeting: 'Welcome back to your Personal Control Center',
  pending_tasks_count: 0,
  upcoming_events_count: 0,
  overdue_reminders_count: 0,
  active_projects_count: 0,
  unread_notifications_count: 0,
  executive_summary: 'Welcome to Personal Control Center! Your workspace is active and ready.',
  focus_recommendation: 'Create a task, project, or note to begin organizing your workflow.',
  bullet_points: [
    'Welcome to your personal control hub.',
    'Create your first project or Kanban task.',
    'Sync your calendar schedule and set daily focus goals.',
  ],
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [briefing, setBriefing] = useState<DailyBriefingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchBriefing = () => {
    setLoading(true);
    setError(false);
    apiClient
      .get<DailyBriefingData>('/assistant/get_daily_briefing')
      .catch(() => apiClient.get<DailyBriefingData>('/assistant/briefing'))
      .then((data) => {
        if (data) setBriefing(data);
        else setBriefing(DEFAULT_BRIEFING);
        setLoading(false);
      })
      .catch(() => {
        setBriefing(DEFAULT_BRIEFING);
        setError(false);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchBriefing();
  }, []);

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const bulletList =
    briefing?.bullet_points && briefing.bullet_points.length > 0
      ? briefing.bullet_points
      : DEFAULT_BRIEFING.bullet_points!;

  return (
    <div className="pcc-dashboard-page">
      {/* 4 Metric Cards at Top */}
      <div className="pcc-dashboard-metrics">
        <Card
          glass
          hoverable
          padding="lg"
          className="pcc-metric-card"
          onClick={() => navigate('/tasks')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/tasks')}
        >
          <div className="pcc-metric-card__header">
            <span className="pcc-metric-card__lbl">Open Tasks</span>
            <span className="pcc-metric-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
          </div>
          <div className="pcc-metric-card__val">{briefing?.pending_tasks_count ?? 0}</div>
          <Badge variant="warning" size="sm">Pending</Badge>
        </Card>

        <Card
          glass
          hoverable
          padding="lg"
          className="pcc-metric-card"
          onClick={() => navigate('/calendar')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/calendar')}
        >
          <div className="pcc-metric-card__header">
            <span className="pcc-metric-card__lbl">Calendar Events</span>
            <span className="pcc-metric-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                <line x1="16" x2="16" y1="2" y2="6" />
                <line x1="8" x2="8" y1="2" y2="6" />
                <line x1="3" x2="21" y1="10" y2="10" />
              </svg>
            </span>
          </div>
          <div className="pcc-metric-card__val">{briefing?.upcoming_events_count ?? 0}</div>
          <Badge variant="primary" size="sm">Scheduled</Badge>
        </Card>

        <Card
          glass
          hoverable
          padding="lg"
          className="pcc-metric-card"
          onClick={() => navigate('/reminders')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/reminders')}
        >
          <div className="pcc-metric-card__header">
            <span className="pcc-metric-card__lbl">Reminders</span>
            <span className="pcc-metric-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
          </div>
          <div className="pcc-metric-card__val">{briefing?.overdue_reminders_count ?? 0}</div>
          <Badge variant="accent" size="sm">Requires Attention</Badge>
        </Card>

        <Card
          glass
          hoverable
          padding="lg"
          className="pcc-metric-card"
          onClick={() => navigate('/projects')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && navigate('/projects')}
        >
          <div className="pcc-metric-card__header">
            <span className="pcc-metric-card__lbl">Active Projects</span>
            <span className="pcc-metric-card__icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </span>
          </div>
          <div className="pcc-metric-card__val">{briefing?.active_projects_count ?? 0}</div>
          <Badge variant="success" size="sm">In Progress</Badge>
        </Card>
      </div>

      {/* Daily Briefing Card directly below top cards */}
      <Card glass padding="lg" className="pcc-daily-briefing">
        <div className="pcc-daily-briefing__header">
          <h2 className="pcc-daily-briefing__title">Daily Briefing</h2>
          <span className="pcc-daily-briefing__date">{formattedDate}</span>
        </div>

        {loading ? (
          <div className="pcc-daily-briefing__loading">
            <Spinner size="sm" />
            <span>Loading briefing data...</span>
          </div>
        ) : error || !briefing ? (
          <div className="pcc-daily-briefing__fallback">
            <p className="pcc-daily-briefing__fallback-text">Unable to load briefing data</p>
          </div>
        ) : (
          <div className="pcc-daily-briefing__body">
            <ul className="pcc-daily-briefing__bullet-list">
              {bulletList.map((bullet, idx) => (
                <li key={idx} className="pcc-daily-briefing__bullet-item">
                  <span className="pcc-daily-briefing__bullet-dot" />
                  <span className="pcc-daily-briefing__bullet-text">{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
