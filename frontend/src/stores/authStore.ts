import { create } from 'zustand';
import type { User } from '@/types';
import {
  getUser,
  login as authLogin,
  logout as authLogout,
  isAuthenticated as checkIsAuthenticated,
} from '@/lib/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      await authLogin(email, password);
      const user = getUser();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    authLogout();
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: () => {
    const authenticated = checkIsAuthenticated();
    const user = authenticated ? getUser() : null;
    set({ user, isAuthenticated: authenticated, isLoading: false });
  },
}));
