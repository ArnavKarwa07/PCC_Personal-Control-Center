import { useIdeaStore } from '../stores/ideaStore';

export const useIdeas = () => {
  const store = useIdeaStore();
  return store;
};
