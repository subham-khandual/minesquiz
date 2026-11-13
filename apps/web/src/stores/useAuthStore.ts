import { create } from 'zustand';
import { UserProfile } from '@mines-quiz/types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null, token?: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  setUser: (user, token) => {
    if (token && typeof window !== 'undefined') {
      localStorage.setItem('mines_quiz_token', token);
    }
    set({ user, token: token || null });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mines_quiz_token');
    }
    set({ user: null, token: null });
  },
}));

