import React from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from '../routes/router';
import { ErrorBoundaryClass } from '../components/ui';

export const App: React.FC = () => {
  return (
    <ErrorBoundaryClass>
      <RouterProvider router={router} />
    </ErrorBoundaryClass>
  );
};

export default App;
