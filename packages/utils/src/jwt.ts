export interface ClientJwtPayload {
  sub?: string;
  email?: string;
  role?: 'student' | 'admin' | 'both';
  displayName?: string;
  iat?: number;
  exp?: number;
}

/**
 * Decodes a standard RFC 7519 JWT payload in browser or Node.js without external dependencies
 */
export function decodeJwtPayload(token: string | null | undefined): ClientJwtPayload | null {
  if (!token || typeof token !== 'string') return null;

  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;

  try {
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }

    let jsonStr = '';
    if (typeof atob !== 'undefined') {
      jsonStr = atob(base64);
    } else if (typeof globalThis !== 'undefined' && (globalThis as any).Buffer) {
      jsonStr = (globalThis as any).Buffer.from(base64, 'base64').toString('utf8');
    } else {
      return null;
    }

    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Validates whether a JWT token has expired based on its exp claim
 */
export function isJwtExpired(token: string | null | undefined): boolean {
  if (!token) return true;

  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) {
    return true;
  }

  const now = Math.floor(Date.now() / 1000);
  return payload.exp <= now;
}
