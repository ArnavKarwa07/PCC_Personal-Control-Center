import { useNoteStore } from '../stores/noteStore';

export const useNotes = () => {
  const store = useNoteStore();
  return store;
};
