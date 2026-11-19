import { NextResponse } from 'next/server';
import {
  SUPER_ADMIN_EMAIL,
  isSuperAdmin,
  isSetupComplete,
  verifyAdminPassword,
} from '../../../../lib/adminAuthStore';
import { getClientIp, checkRateLimit, resetRateLimit } from '../../../../lib/rateLimit';
import { createSignedJwt } from '../../../../lib/jwtServer';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 10 login requests per 15 minutes per IP to block dictionary attacks
    const ipLimit = checkRateLimit(`admin_login_ip_${clientIp}`, 10, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many login attempts from this network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';
    const password = body?.password ? String(body.password) : '';

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    // Account Lockout Guard: 5 failed attempts locks login for 15 minutes
    const accountLockKey = `admin_login_account_${email}`;
    const accountLimit = checkRateLimit(accountLockKey, 5, 900);
    if (!accountLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Account temporarily locked due to 5 consecutive failed attempts. Please retry after ${accountLimit.retryAfterSeconds} seconds or use Forgot Password.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(accountLimit.retryAfterSeconds) },
        }
      );
    }

    // Strict Whitelist Check
    if (!isSuperAdmin(email)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unauthorized: Only verified Admin (${SUPER_ADMIN_EMAIL}) has administrator access.`,
        },
        { status: 403 }
      );
    }

    // Check if initial setup has been performed
    if (!isSetupComplete()) {
      return NextResponse.json(
        {
          success: false,
          needsSetup: true,
          error: 'First-time setup required. Please verify with Gmail OTP to configure your Master Password.',
        },
        { status: 400 }
      );
    }

    // Verify cryptographic salted hash
    const isValid = verifyAdminPassword(password);
    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: `Incorrect master password. ${accountLimit.remaining} attempts remaining before temporary account lockout.`,
        },
        { status: 401 }
      );
    }

    // Password verified: clear account lockout counters immediately
    resetRateLimit(accountLockKey);
    resetRateLimit(`admin_login_ip_${clientIp}`);

    const rememberMe = Boolean(body?.rememberMe);
    const expiresInSeconds = rememberMe ? 7 * 86400 : 86400;
    const token = createSignedJwt(
      {
        sub: 'admin-super-001',
        email: SUPER_ADMIN_EMAIL,
        role: 'admin',
        displayName: 'Subham Khandual (Admin)',
      },
      expiresInSeconds
    );

    return NextResponse.json({
      success: true,
      message: 'Admin authentication successful.',
      user: {
        id: 'admin-super-001',
        firebaseUid: 'uid-admin-owner',
        email: SUPER_ADMIN_EMAIL,
        displayName: 'Subham Khandual (Admin)',
        role: 'admin',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      token,
    });
  } catch (error: any) {
    console.error('API /api/admin/login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while logging in.' },
      { status: 500 }
    );
  }
}
