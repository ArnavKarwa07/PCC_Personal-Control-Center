import React from 'react';
import { NotesWorkspace } from './NotesWorkspace';

export const NotesPage: React.FC = () => {
  return (
    <div className="pcc-notes-page" id="notes-page-root">
      <NotesWorkspace />
    </div>
  );
};

export default NotesPage;
