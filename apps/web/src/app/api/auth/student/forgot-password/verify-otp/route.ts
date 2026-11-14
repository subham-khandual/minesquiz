import { NextResponse } from 'next/server';
import { verifyStudentResetOtp } from '../../../../../../lib/studentAuthStore';
import { getClientIp, checkRateLimit } from '../../../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 30 OTP verification attempts per 15 minutes per IP
    const ipLimit = checkRateLimit(`student_verify_reset_otp_ip_${clientIp}`, 30, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many verification attempts from this network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';
    const otp = body?.otp ? String(body.otp).trim() : '';

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Both email and 6-digit verification code are required.' },
        { status: 400 }
      );
    }

    const result = verifyStudentResetOtp(email, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      resetToken: result.resetToken,
      message: 'Verification code confirmed. You may now set your new password.',
    });
  } catch (error: any) {
    console.error('API /api/auth/student/forgot-password/verify-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying reset code.' },
      { status: 500 }
    );
  }
}
