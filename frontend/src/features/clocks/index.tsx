import React from 'react';
import { PlaceholderPage } from '../../components/PlaceholderPage';

export const ClocksPage: React.FC = () => {
  return (
    <PlaceholderPage
      title="World Clocks & Timezones"
      subtitle="Global team clocks, UTC offsets, and visual overlap planners."
      category="Clocks"
      stats={[
        { label: 'Saved Clocks', value: 4, change: 'SF, NYC, London, Tokyo', positive: true },
      ]}
      actions={[{ label: 'Add Timezone', variant: 'primary' }]}
    />
  );
};

export default ClocksPage;
