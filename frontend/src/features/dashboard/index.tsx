import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Badge } from '../../components/ui';
import { AIAssistantWidget } from '../../components/AIAssistantWidget';
import { FinancialVelocityChart } from '../../components/FinancialVelocityChart';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="pcc-dashboard-page">
      <div className="pcc-dashboard-header">
        <div>
          <h1 className="pcc-dashboard-title">Personal OS Command Center</h1>
          <p className="pcc-dashboard-subtitle">Unified telemetry across your productivity, finances, health, CRM, and goals</p>
        </div>
      </div>

      {/* AI Assistant Command Widget */}
      <AIAssistantWidget />

      {/* Primary OS Metric Gauges */}
      <div className="pcc-dashboard-metrics">
        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/tasks')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/tasks')}>
          <span className="pcc-metric-card__lbl">Pending Tasks</span>
          <div className="pcc-metric-card__val">12</div>
          <Badge variant="warning" size="sm">3 High Priority</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/finances')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/finances')}>
          <span className="pcc-metric-card__lbl">Net Worth Balance</span>
          <div className="pcc-metric-card__val" style={{ color: 'var(--color-success)' }}>₹1,43,000</div>
          <Badge variant="success" size="sm">+₹1.85L / -₹42k</Badge>
        </Card>

        <Card glass hoverable padding="md" className="pcc-metric-card" onClick={() => navigate('/fitness')} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && navigate('/fitness')}>
          <span className="pcc-metric-card__lbl">Habit Streak</span>
          <div className="pcc-metric-card__val">12 Days 🔥</div>
          <Badge variant="primary" size="sm">2,100 ml Water</Badge>
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

      {/* Financial Cashflow Velocity SVG Telemetry */}
      <Card glass padding="lg" className="pcc-dashboard-chart-card">
        <FinancialVelocityChart
          title="Financial Cashflow Velocity Telemetry"
          subtitle="6-Month trajectory across revenue & operational expenses (INR ₹)"
        />
      </Card>

      <div className="pcc-dashboard-sections">
        <Card glass padding="lg" className="pcc-dashboard-focus">
          <h2>Today&apos;s Priority Execution</h2>
          <div className="pcc-focus-list">
            <div className="pcc-focus-item">
              <div>
                <strong>🚀 Finalize PCC Phase E Release Verification</strong>
                <p>Run backend tests, tsc checks, Vite production build</p>
              </div>
              <Badge variant="accent">High</Badge>
            </div>
            <div className="pcc-focus-item">
              <div>
                <strong>📅 Sync on OpenAPI Endpoint Specs</strong>
                <p>Ensure single clean route mapping per endpoint in /docs</p>
              </div>
              <Badge variant="info">14:00</Badge>
            </div>
            <div className="pcc-focus-item">
              <div>
                <strong>💪 Hydration & Strength Training</strong>
                <p>45-min upper body workout & log 3000ml water</p>
              </div>
              <Badge variant="success">Health</Badge>
            </div>
          </div>
        </Card>

        <Card glass padding="lg" className="pcc-dashboard-actions">
          <h2>System Command Shortcuts</h2>
          <div className="pcc-actions-grid">
            <Button variant="primary" onClick={() => navigate('/tasks')}>Manage Tasks</Button>
            <Button variant="outline" onClick={() => navigate('/finances')}>Finances Engine</Button>
            <Button variant="outline" onClick={() => navigate('/fitness')}>Fitness Telemetry</Button>
            <Button variant="outline" onClick={() => navigate('/contacts')}>Personal CRM</Button>
            <Button variant="outline" onClick={() => navigate('/goals')}>OKRs Matrix</Button>
            <Button variant="secondary" onClick={() => navigate('/calendar')}>Calendar Grid</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
