import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';
import { Card } from '../../components/ui';

export const CareerPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Career & Professional Growth"
      subtitle="Resume iterations, achievements log, job pipeline, and personal brand assets."
      category="Career"
      stats={[
        { label: 'Achievements Logged', value: 34, change: '+4 this quarter', positive: true },
        { label: 'Active Pipeline', value: 3, change: 'Opportunities', positive: true },
        { label: 'Resume Versions', value: 5, change: 'Updated', positive: true },
      ]}
      actions={[
        { label: 'Log Achievement', variant: 'primary' },
        { label: 'Update Resume', variant: 'secondary' },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-4)' }}>
        <Card header={<h3 style={{ margin: 0, fontSize: 'var(--font-size-base)' }}>Recent Highlights</h3>}>
          <ul style={{ paddingLeft: 'var(--space-4)', margin: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
            <li>Architected PCC Personal Control Center multi-agent productivity ecosystem</li>
            <li>Optimized frontend latency and WCAG AA accessibility compliance</li>
            <li>Published technical articles on distributed state synchronization</li>
          </ul>
        </Card>
      </div>
    </PlaceholderPage>
  );
};

export default CareerPage;
