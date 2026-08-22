import { create } from 'zustand';
import type { AuthState, User } from '../types';

const STORAGE_KEY_TOKEN = 'pcc_auth_token';
const STORAGE_KEY_USER = 'pcc_auth_user';

const getSafeStorageItem = (key: string): string | null => {
  try {
    return typeof localStorage !== 'undefined' ? localStorage.getItem(key) : null;
  } catch {
    return null;
  }
};

const isLoggedOut = getSafeStorageItem('pcc_logged_out') === 'true';
const storedToken = getSafeStorageItem(STORAGE_KEY_TOKEN);
let storedUser: User | null = null;

try {
  const raw = getSafeStorageItem(STORAGE_KEY_USER);
  if (raw) storedUser = JSON.parse(raw);
} catch {
  storedUser = null;
}

const initialToken = storedToken || (isLoggedOut ? null : 'mock-dev-token');
const initialAuth = Boolean(initialToken);

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: storedUser || (initialAuth ? {
    id: 'usr-default',
    name: 'Arnav',
    email: 'arnav@pcc.local',
    role: 'Admin',
  } : null),
  token: initialToken,
  isAuthenticated: initialAuth,

  login: (user: User, token: string) => {
    try {
      localStorage.removeItem('pcc_logged_out');
      localStorage.setItem(STORAGE_KEY_TOKEN, token);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (err) {
      console.warn('localStorage write failed during login:', err);
    }
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    try {
      localStorage.setItem('pcc_logged_out', 'true');
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } catch (err) {
      console.warn('localStorage write failed during logout:', err);
    }
    set({ user: null, token: null, isAuthenticated: false });
  },

  setUser: (user: User) => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (err) {
      console.warn('localStorage write failed during setUser:', err);
    }
    set({ user });
  },

  resetToMockToken: () => {
    const currentUser = get().user;
    const defaultUser: User = {
      id: 'usr-default',
      name: 'Arnav',
      email: 'arnav@pcc.local',
      role: 'Admin',
    };
    const targetUser = currentUser || defaultUser;

    try {
      localStorage.removeItem('pcc_logged_out');
      localStorage.setItem(STORAGE_KEY_TOKEN, 'mock-dev-token');
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(targetUser));
    } catch (err) {
      console.warn('localStorage write failed during resetToMockToken:', err);
    }

    set({
      token: 'mock-dev-token',
      isAuthenticated: true,
      user: targetUser,
    });
  },
}));

