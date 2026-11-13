import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';
import { env } from '../config/env';
import { sendError } from '../utils/apiResponse';
import { UserRole } from '@mines-quiz/types';

// Initialize Firebase Admin if credentials are supplied
let firebaseInitialized = false;
if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: env.FIREBASE_PROJECT_ID,
        clientEmail: env.FIREBASE_CLIENT_EMAIL,
        privateKey: env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
    firebaseInitialized = true;
    console.log('[Auth] Firebase Admin SDK initialized successfully');
  } catch (err) {
    console.warn('[Auth Warning] Firebase initialization failed:', (err as Error).message);
  }
}

export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name: string;
    role: UserRole;
  };
}

export async function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // In local development mode without strict token, allow mock student identity if header not sent
    if (env.NODE_ENV === 'development') {
      req.user = {
        uid: 'dev-user-001',
        email: 'dev.student@minesquiz.local',
        name: 'Developer Student',
        role: 'admin',
      };
      return next();
    }
    sendError(res, 'Authorization token missing or invalid', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    if (firebaseInitialized) {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email || '',
        name: decodedToken.name || decodedToken.email?.split('@')[0] || 'User',
        role: (decodedToken.role as UserRole) || 'student',
      };
      next();
    } else {
      // Development fallback token parsing strictly in local dev mode
      if (env.NODE_ENV === 'development') {
        req.user = {
          uid: 'dev-user-001',
          email: 'dev.student@minesquiz.local',
          name: 'Developer Student',
          role: 'admin',
        };
        return next();
      }
      return sendError(res, 'Authentication service uninitialized or misconfigured', 500, 'AUTH_CONFIG_ERROR');
    }
  } catch (error) {
    sendError(res, 'Invalid or expired authentication token', 401, 'INVALID_TOKEN', (error as Error).message);
  }
}

export function roleGuard(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'User identity not found', 401, 'UNAUTHORIZED');
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions for this resource', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}

