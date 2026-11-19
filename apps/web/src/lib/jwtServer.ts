import crypto from 'node:crypto';

const JWT_SECRET =
  process.env.JWT_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  'minesquiz_statutory_dgms_super_secret_jwt_key_2026';

export interface ServerJwtPayload {
  sub: string;
  email: string;
  role: 'student' | 'admin' | 'both';
  displayName?: string;
  iat?: number;
  exp?: number;
}

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(str: string): string {
  let s = str.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) {
    s += '=';
  }
  return Buffer.from(s, 'base64').toString('utf8');
}

/**
 * Generates an RFC 7519 HMAC-SHA256 signed JSON Web Token
 */
export function createSignedJwt(
  payload: Omit<ServerJwtPayload, 'iat' | 'exp'>,
  expiresInSeconds: number = 86400
): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: ServerJwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(fullPayload));
  const data = `${encodedHeader}.${encodedPayload}`;

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${data}.${signature}`;
}

/**
 * Cryptographically verifies an RFC 7519 JWT token signature and expiration
 */
export function verifySignedJwt(token: string | null | undefined): {
  valid: boolean;
  payload?: ServerJwtPayload;
  error?: string;
} {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'Token missing or invalid' };
  }

  const parts = token.trim().split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed JWT structure' };
  }

  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;

  const expectedSignature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(data)
    .digest('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  if (signature !== expectedSignature) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payload: ServerJwtPayload = JSON.parse(base64UrlDecode(encodedPayload));
    const now = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < now) {
      return { valid: false, error: 'Token expired', payload };
    }

    return { valid: true, payload };
  } catch {
    return { valid: false, error: 'Failed to decode payload' };
  }
}
