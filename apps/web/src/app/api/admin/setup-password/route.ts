import { NextResponse } from 'next/server';
import {
  SUPER_ADMIN_EMAIL,
  isSuperAdmin,
  verifyResetToken,
  consumeResetToken,
  setAdminPassword,
} from '../../../../lib/adminAuthStore';
import { getClientIp, checkRateLimit } from '../../../../lib/rateLimit';
import { createSignedJwt } from '../../../../lib/jwtServer';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 5 password configuration attempts per 15 minutes per IP
    const ipLimit = checkRateLimit(`setup_password_ip_${clientIp}`, 5, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password configuration requests from this network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }
    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';
    const resetToken = body?.resetToken ? String(body.resetToken).trim() : '';
    const newPassword = body?.newPassword ? String(body.newPassword) : '';

    if (!email || !resetToken || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, verification token, and new password are required.' },
        { status: 400 }
      );
    }

    if (!isSuperAdmin(email)) {
      return NextResponse.json(
        { success: false, error: `Unauthorized: Only ${SUPER_ADMIN_EMAIL} can configure Admin password.` },
        { status: 403 }
      );
    }

    // Verify single-use reset token
    const tokenValid = verifyResetToken(email, resetToken);
    if (!tokenValid) {
      return NextResponse.json(
        { success: false, error: 'Verification token is invalid or expired. Please verify via OTP again.' },
        { status: 401 }
      );
    }

    // Set new password
    const result = setAdminPassword(newPassword);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Password does not meet security requirements.' },
        { status: 400 }
      );
    }

    // Consume reset token so it cannot be reused
    consumeResetToken(email, resetToken);

    const token = createSignedJwt(
      {
        sub: 'admin-super-001',
        email: SUPER_ADMIN_EMAIL,
        role: 'admin',
        displayName: 'Subham Khandual (Admin)',
      },
      86400
    );

    return NextResponse.json({
      success: true,
      message: 'Admin Master Password saved successfully.',
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
    console.error('API /api/admin/setup-password error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while setting admin password.' },
      { status: 500 }
    );
  }
}
