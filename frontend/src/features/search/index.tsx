import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';

export const SearchPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="Global Search & Index"
      subtitle="Full-text and semantic search across tasks, projects, notes, docs, and calendar."
      category="Search"
      stats={[{ label: 'Indexed Items', value: '1,420', change: 'Live index', positive: true }]}
      actions={[{ label: 'Re-index System', variant: 'secondary' }]}
    />
  );
};

export default SearchPage;
