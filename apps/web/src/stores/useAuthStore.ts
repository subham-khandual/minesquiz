import { create } from 'zustand';
import { UserProfile } from '@mines-quiz/types';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null, token?: string) => void;
  logout: () => void;
}

const getInitialUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('mines_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }
    const email = localStorage.getItem('mines_candidate_email');
    const name = localStorage.getItem('mines_candidate_name');
    if (email) {
      return {
        id: 'candidate-' + email,
        firebaseUid: 'candidate-' + email,
        email,
        displayName: name || email.split('@')[0],
        role: email.toLowerCase() === 'subhamkhandual215@gmail.com' ? 'both' : 'student',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  } catch {
    return null;
  }
  return null;
};

const getInitialToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem('mines_quiz_token');
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isLoading: false,
  setUser: (user, token) => {
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('mines_quiz_token', token);
      }
      if (user) {
        try {
          localStorage.setItem('mines_user_profile', JSON.stringify(user));
          if (user.email) {
            localStorage.setItem('mines_candidate_email', user.email);
          }
          if (user.displayName) {
            localStorage.setItem('mines_candidate_name', user.displayName);
          }
        } catch (e) {
          console.warn('[useAuthStore] Failed to cache user profile in localStorage:', e);
        }
      }
    }
    set((state) => ({ user, token: token !== undefined ? token : state.token }));
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mines_quiz_token');
      localStorage.removeItem('mines_user_profile');
      localStorage.removeItem('mines_candidate_email');
      localStorage.removeItem('mines_candidate_name');
    }
    set({ user: null, token: null });
  },
}));

