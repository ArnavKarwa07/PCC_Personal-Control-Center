import { create } from 'zustand';
import type { AuthState, User } from '../types';

const STORAGE_KEY_TOKEN = 'pcc_auth_token';
const STORAGE_KEY_USER = 'pcc_auth_user';

const storedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
let storedUser: User | null = null;
try {
  const raw = localStorage.getItem(STORAGE_KEY_USER);
  if (raw) storedUser = JSON.parse(raw);
} catch {
  storedUser = null;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: storedUser || {
    id: 'usr-default',
    name: 'Arnav',
    email: 'arnav@pcc.local',
    role: 'Admin',
  },
  token: storedToken || 'mock-dev-token',
  isAuthenticated: true, // Defaults to authenticated for local development shell

  login: (user: User, token: string) => {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    set({ user });
  },

  resetToMockToken: () => {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    set((state: AuthState) => ({
      ...state,
      token: 'mock-dev-token',
      isAuthenticated: true,
      user: state.user || {
        id: 'usr-default',
        name: 'Arnav',
        email: 'arnav@pcc.local',
        role: 'Admin',
      },
    }));
  },
}));

