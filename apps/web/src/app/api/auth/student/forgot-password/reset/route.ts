import { NextResponse } from 'next/server';
import { updateCandidatePassword } from '../../../../../../lib/studentAuthStore';
import { getClientIp, checkRateLimit } from '../../../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 10 password reset submissions per 15 minutes per IP
    const ipLimit = checkRateLimit(`student_reset_pwd_ip_${clientIp}`, 10, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many password reset requests from this network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
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

    if (newPassword.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must contain at least 8 characters.' },
        { status: 400 }
      );
    }

    const result = updateCandidatePassword(email, resetToken, newPassword);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update candidate password.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your password has been successfully updated. Please sign in with your new password.',
    });
  } catch (error: any) {
    console.error('API /api/auth/student/forgot-password/reset error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while updating password.' },
      { status: 500 }
    );
  }
}
