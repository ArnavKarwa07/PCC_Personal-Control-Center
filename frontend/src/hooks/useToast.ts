import { create } from 'zustand';
import type { Toast } from '../types';
import { generateId } from '../utils';

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = generateId('toast');
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? 5000,
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    return id;
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
  clearAll: () => set({ toasts: [] }),
}));

export function useToast() {
  const { addToast, removeToast, clearAll } = useToastStore();

  const toast = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  };

  toast.success = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'success', title, message, duration });
  };

  toast.error = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'error', title, message, duration });
  };

  toast.warning = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'warning', title, message, duration });
  };

  toast.info = (title: string, message?: string, duration?: number) => {
    return addToast({ type: 'info', title, message, duration });
  };

  toast.remove = removeToast;
  toast.clearAll = clearAll;

  return { toast, addToast, removeToast, clearAll };
}
