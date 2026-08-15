import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';

export const ReviewsPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Weekly & Monthly Reviews"
      subtitle="Reflect on productivity metrics, accomplishments, roadblocks, and plan ahead."
      category="Reflection"
      stats={[
        { label: 'Reviews Completed', value: 42, change: '100% streak', positive: true },
        { label: 'Avg Productivity', value: '8.7/10', change: '+0.4', positive: true },
      ]}
      actions={[{ label: 'Start Weekly Review', variant: 'primary' }]}
    />
  );
};

export default ReviewsPage;
