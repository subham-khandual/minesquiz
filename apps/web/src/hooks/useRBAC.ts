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
  const isAuthenticated = !!user;
  const isStudent = role === 'student';
  const isAdmin = role === 'admin';

  return {
    user,
    role,
    isAuthenticated,
    isStudent,
    isAdmin,
    // RBAC Business Rules
    canTakeExam: !isAuthenticated || isStudent,
    canManageQuizzes: isAdmin,
    canViewAuditLogs: isAdmin,
  };
}
