import { create } from 'zustand';
import type { UIState, Theme } from '../types';

const STORAGE_KEY_SIDEBAR = 'pcc_sidebar_collapsed';
const STORAGE_KEY_THEME = 'pcc_theme';

const initialSidebar = localStorage.getItem(STORAGE_KEY_SIDEBAR) === 'true';
const initialTheme: Theme = (localStorage.getItem(STORAGE_KEY_THEME) as Theme) || 'light';

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: initialSidebar,
  theme: initialTheme,
  commandPaletteOpen: false,

  toggleSidebar: () =>
    set((state) => {
      const next = !state.sidebarCollapsed;
      localStorage.setItem(STORAGE_KEY_SIDEBAR, String(next));
      return { sidebarCollapsed: next };
    }),

  setSidebarCollapsed: (collapsed: boolean) => {
    localStorage.setItem(STORAGE_KEY_SIDEBAR, String(collapsed));
    set({ sidebarCollapsed: collapsed });
  },

  setTheme: (theme: Theme) => {
    localStorage.setItem(STORAGE_KEY_THEME, theme);
    document.documentElement.setAttribute('data-theme', theme);
    set({ theme });
  },

  toggleCommandPalette: () =>
    set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),

  setCommandPaletteOpen: (open: boolean) =>
    set({ commandPaletteOpen: open }),
}));
