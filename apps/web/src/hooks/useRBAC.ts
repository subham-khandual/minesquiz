'use client';

import { useAuthStore } from '../stores/useAuthStore';
import { UserRole } from '@mines-quiz/types';

export interface RBACPermissions {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  role: UserRole | null;
  isAuthenticated: boolean;
  isStudent: boolean;
  isAdmin: boolean;
  canTakeExam: boolean;
  canManageQuizzes: boolean;
  canViewAuditLogs: boolean;
}

export function useRBAC(): RBACPermissions {
  const { user } = useAuthStore();

  const role = user?.role || null;
  const isMasterUser = (user?.email || '').toLowerCase() === 'subhamkhandual215@gmail.com';
  const isAuthenticated = !!user;
  const isStudent = role === 'student' || isMasterUser;
  const isAdmin = role === 'admin' || isMasterUser;

  return {
    user,
    role,
    isAuthenticated,
    isStudent,
    isAdmin,
    // RBAC Business Rules (Master user has dual student and admin privileges)
    canTakeExam: !isAuthenticated || isStudent || isMasterUser,
    canManageQuizzes: isAdmin || isMasterUser,
    canViewAuditLogs: isAdmin || isMasterUser,
  };
}
