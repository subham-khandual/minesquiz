import { create } from 'zustand';
import { UserProfile } from '@mines-quiz/types';
import { decodeJwtPayload, isJwtExpired } from '@mines-quiz/utils';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  setUser: (user: UserProfile | null, token?: string, rememberMe?: boolean) => void;
  logout: () => void;
}

export const clearAuthStorage = () => {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('mines_quiz_token');
    sessionStorage.removeItem('mines_user_profile');
    sessionStorage.removeItem('mines_candidate_email');
    sessionStorage.removeItem('mines_candidate_name');

    localStorage.removeItem('mines_quiz_token');
    localStorage.removeItem('mines_user_profile');
    localStorage.removeItem('mines_candidate_email');
    localStorage.removeItem('mines_candidate_name');
  } catch {}
};

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  try {
    // Session storage takes precedence (single tab / browser session)
    const sessionToken = sessionStorage.getItem('mines_quiz_token');
    if (sessionToken) return sessionToken;
    // Fallback to localStorage (only if Remember Me was explicitly chosen)
    return localStorage.getItem('mines_quiz_token');
  } catch {
    return null;
  }
};

const getInitialUser = (): UserProfile | null => {
  if (typeof window === 'undefined') return null;
  try {
    const token = getStoredToken();
    if (!token) {
      // No token present: do not automatically reconstruct a logged-in user
      return null;
    }

    // Cryptographic RFC 7519 JWT Expiration Check
    if (isJwtExpired(token)) {
      clearAuthStorage();
      return null;
    }

    // Token is valid: load stored profile from active storage
    const raw =
      sessionStorage.getItem('mines_user_profile') ||
      localStorage.getItem('mines_user_profile');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.email) return parsed;
    }

    // Reconstruct user identity from verified JWT claims
    const payload = decodeJwtPayload(token);
    if (payload && payload.email) {
      return {
        id: payload.sub || 'candidate-' + payload.email,
        firebaseUid: payload.sub || 'candidate-' + payload.email,
        email: payload.email,
        displayName: payload.displayName || payload.email.split('@')[0],
        role:
          (payload.role as any) ||
          (payload.email.toLowerCase() === 'subhamkhandual215@gmail.com' ? 'both' : 'student'),
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
  const token = getStoredToken();
  if (!token || isJwtExpired(token)) return null;
  return token;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: getInitialUser(),
  token: getInitialToken(),
  isLoading: false,
  setUser: (user, token, rememberMe = false) => {
    if (typeof window !== 'undefined') {
      if (!user) {
        clearAuthStorage();
      } else {
        const targetStorage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;

        try {
          otherStorage.removeItem('mines_quiz_token');
          otherStorage.removeItem('mines_user_profile');
          otherStorage.removeItem('mines_candidate_email');
          otherStorage.removeItem('mines_candidate_name');
        } catch {}

        if (token) {
          targetStorage.setItem('mines_quiz_token', token);
        }
        try {
          targetStorage.setItem('mines_user_profile', JSON.stringify(user));
          if (user.email) {
            targetStorage.setItem('mines_candidate_email', user.email);
          }
          if (user.displayName) {
            targetStorage.setItem('mines_candidate_name', user.displayName);
          }
        } catch (e) {
          console.warn('[useAuthStore] Failed to cache user profile:', e);
        }
      }
    }
    set((state) => ({ user, token: token !== undefined ? token : state.token }));
  },
  logout: () => {
    clearAuthStorage();
    set({ user: null, token: null });
  },
}));
