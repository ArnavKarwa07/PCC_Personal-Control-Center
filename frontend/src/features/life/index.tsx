import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';
import { Card, Badge } from '../../components/ui';

export const LifePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Life & Health Admin"
      subtitle="Track routines, fitness logs, personal finance, and lifestyle milestones."
      category="Life OS"
      stats={[
        { label: 'Workout Streak', value: '14 days', change: 'Personal record', positive: true },
        { label: 'Sleep Average', value: '7.8 hrs', change: '+0.5 hrs', positive: true },
        { label: 'Habit Completion', value: '92%', change: 'This week', positive: true },
      ]}
      actions={[
        { label: 'Log Habit', variant: 'primary' },
        { label: 'Add Metric', variant: 'secondary' },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <Card header={<h3 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Daily Habits</h3>}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>💧 Drink 3L Water</span>
              <Badge variant="success" size="sm">Completed</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>🏃 Morning Run & Stretch</span>
              <Badge variant="success" size="sm">Completed</Badge>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>📖 Read 30 Mins</span>
              <Badge variant="warning" size="sm">Pending</Badge>
            </div>
          </div>
        </Card>
      </div>
    </PlaceholderPage>
  );
};

export default LifePage;
