import { useProjectStore } from '../stores/projectStore';

export const useProjects = () => {
  const store = useProjectStore();
  return store;
};
