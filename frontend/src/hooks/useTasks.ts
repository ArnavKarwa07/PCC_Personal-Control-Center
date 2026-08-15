import { useTaskStore } from '../stores/taskStore';

export const useTasks = () => {
  const store = useTaskStore();
  return store;
};
