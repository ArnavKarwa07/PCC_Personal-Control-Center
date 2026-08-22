import { create } from 'zustand';
import type { AuthState, User } from '../types';

export const DEFAULT_OWNER_USER: User = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Arnav Karwa',
  full_name: 'Arnav Karwa',
  email: 'arnavkarwa07@gmail.com',
  role: 'Owner',
  avatarUrl: '/logo.png',
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: DEFAULT_OWNER_USER,
  token: 'pcc_owner_session',
  isAuthenticated: true,

  login: (user: User, token: string) => {
    const formattedUser: User = {
      ...user,
      name: user.name || user.full_name || 'Arnav Karwa',
      full_name: user.full_name || user.name || 'Arnav Karwa',
    };
    set({ user: formattedUser, token: token || 'pcc_owner_session', isAuthenticated: true });
  },

  logout: () => {
    set({ user: DEFAULT_OWNER_USER, token: 'pcc_owner_session', isAuthenticated: true });
  },

  setUser: (user: User) => {
    const formattedUser: User = {
      ...user,
      name: user.name || user.full_name || 'Arnav Karwa',
      full_name: user.full_name || user.name || 'Arnav Karwa',
    };
    set({ user: formattedUser });
  },

  resetToMockToken: () => {
    set({
      token: 'pcc_owner_session',
      isAuthenticated: true,
      user: DEFAULT_OWNER_USER,
    });
  },
}));
