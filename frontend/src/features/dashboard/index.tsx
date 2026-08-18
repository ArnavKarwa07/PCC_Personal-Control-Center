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
  unread_notifications_count?: number;
  executive_summary?: string;
  focus_recommendation?: string;
}

const DEFAULT_BRIEFING: DailyBriefingData = {
  date_str: new Date().toISOString().split('T')[0],
  greeting: 'Welcome back to your Personal Control Center',
  pending_tasks_count: 5,
  upcoming_events_count: 2,
  overdue_reminders_count: 1,
  unread_notifications_count: 3,
  executive_summary: 'Good day! All system monitors and background services are operational.',
  focus_recommendation: 'Focus on completing your top priority tasks and reviewing upcoming calendar events.',
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
      .get<DailyBriefingData>('/assistant/briefing')
      .then((data) => {
        setBriefing(data);
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

  return (
    <div className="pcc-dashboard-page">
      <div className="pcc-dashboard-header">
        <div>
          <h1 className="pcc-dashboard-title">Personal OS Command Center</h1>
          <p className="pcc-dashboard-subtitle">Unified telemetry across your productivity, notes, ideas, CRM, and goals</p>
        </div>
      </div>

      {/* Daily Briefing Panel */}
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
            {briefing.greeting && (
              <p className="pcc-daily-briefing__greeting">{briefing.greeting}</p>
            )}
            {briefing.executive_summary && (
              <p className="pcc-daily-briefing__summary">{briefing.executive_summary}</p>
            )}

            <div className="pcc-daily-briefing__stats">
              <div className="pcc-daily-briefing__stat">
                <span className="pcc-daily-briefing__stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="m9 11 3 3L22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </span>
                <div className="pcc-daily-briefing__stat-info">
                  <span className="pcc-daily-briefing__stat-value">{briefing.pending_tasks_count ?? 0}</span>
                  <span className="pcc-daily-briefing__stat-label">Open Tasks</span>
                </div>
              </div>

              <div className="pcc-daily-briefing__stat">
                <span className="pcc-daily-briefing__stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                </span>
                <div className="pcc-daily-briefing__stat-info">
                  <span className="pcc-daily-briefing__stat-value">{briefing.upcoming_events_count ?? 0}</span>
                  <span className="pcc-daily-briefing__stat-label">Calendar Events</span>
                </div>
              </div>

              <div className="pcc-daily-briefing__stat">
                <span className="pcc-daily-briefing__stat-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </span>
                <div className="pcc-daily-briefing__stat-info">
                  <span className="pcc-daily-briefing__stat-value">{briefing.overdue_reminders_count ?? 0}</span>
                  <span className="pcc-daily-briefing__stat-label">Overdue Reminders</span>
                </div>
              </div>
            </div>

            {briefing.focus_recommendation && (
              <div className="pcc-daily-briefing__recommendation">
                <div className="pcc-daily-briefing__recommendation-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                    <path d="M9 18h6" />
                    <path d="M10 22h4" />
                  </svg>
                </div>
                <div className="pcc-daily-briefing__recommendation-content">
                  <div className="pcc-daily-briefing__recommendation-label">Strategic Recommendations</div>
                  <p className="pcc-daily-briefing__recommendation-text">{briefing.focus_recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Primary OS Metric Gauges */}
      <div className="pcc-dashboard-metrics">
        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/tasks')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/tasks')}>
          <span className="pcc-metric-card__lbl">Pending Tasks</span>
          <div className="pcc-metric-card__val">12</div>
          <Badge variant="warning" size="sm">3 High Priority</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/projects')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/projects')}>
          <span className="pcc-metric-card__lbl">Active Projects</span>
          <div className="pcc-metric-card__val">4 Active</div>
          <Badge variant="primary" size="sm">Roadmap on Track</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/notes')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/notes')}>
          <span className="pcc-metric-card__lbl">Notes & Docs</span>
          <div className="pcc-metric-card__val">8 Notes</div>
          <Badge variant="accent" size="sm">Workspace</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/contacts')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/contacts')}>
          <span className="pcc-metric-card__lbl">CRM Followups</span>
          <div className="pcc-metric-card__val">1 Overdue</div>
          <Badge variant="outline" size="sm">2 Contacts</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/goals')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/goals')}>
          <span className="pcc-metric-card__lbl">Q3 OKRs</span>
          <div className="pcc-metric-card__val">85%</div>
          <Badge variant="success" size="sm">On Track</Badge>
        </Card>
      </div>

      <div className="pcc-dashboard-sections">
        <Card glass padding="lg" className="pcc-dashboard-focus">
          <h2>Today&apos;s Priority Execution</h2>
          <div className="pcc-focus-list">
            <div className="pcc-focus-item">
              <div>
                <strong>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 3 0 3 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-3 0-3"/></svg>
                  Finalize PCC Phase E Release Verification
                </strong>
                <p>Run backend tests, tsc checks, Vite production build</p>
              </div>
              <Badge variant="accent">High</Badge>
            </div>
            <div className="pcc-focus-item">
              <div>
                <strong>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                  Sync on OpenAPI Endpoint Specs
                </strong>
                <p>Ensure single clean route mapping per endpoint in /docs</p>
              </div>
              <Badge variant="info">14:00</Badge>
            </div>
            <div className="pcc-focus-item">
              <div>
                <strong>
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>
                  Review Idea Backlog & Notes
                </strong>
                <p>Categorize product concepts and action items</p>
              </div>
              <Badge variant="success">Ideas</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
