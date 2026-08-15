import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';
import { Card, Badge } from '../../components/ui';

export const KnowledgePage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Knowledge & Learning Hub"
      subtitle="Connected notes, wikis, research papers, and technical cheat sheets."
      category="Second Brain"
      stats={[
        { label: 'Total Notes', value: 142, change: '+12 this month', positive: true },
        { label: 'Topics Covered', value: 24, change: 'Growing', positive: true },
        { label: 'Reading List', value: 8, change: '3 in progress', positive: true },
      ]}
      actions={[
        { label: 'New Note', variant: 'primary' },
        { label: 'Import Markdown', variant: 'secondary' },
      ]}
    >
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-4)' }}>
        <Card hoverable padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>System Architecture Patterns</h3>
            <Badge variant="accent" size="sm">Architecture</Badge>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Notes on event-driven architectures, domain-driven design, and microservices caching strategies.
          </p>
        </Card>

        <Card hoverable padding="md">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
            <h3 style={{ fontSize: 'var(--font-size-base)', margin: 0 }}>React & Web Performance</h3>
            <Badge variant="info" size="sm">Frontend</Badge>
          </div>
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
            Techniques for hydration speed, bundle splitting, Web Vitals, and canvas optimization.
          </p>
        </Card>
      </div>
    </PlaceholderPage>
  );
};

export default KnowledgePage;
