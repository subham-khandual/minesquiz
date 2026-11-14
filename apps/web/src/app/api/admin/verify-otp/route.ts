import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAIL, isSuperAdmin, verifyAdminOtp } from '../../../../lib/adminAuthStore';
import { getClientIp, checkRateLimit } from '../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 20 OTP verification attempts per 15 minutes per IP
    const ipLimit = checkRateLimit(`verify_otp_ip_${clientIp}`, 20, 900);
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
        { success: false, error: 'Email and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    if (!isSuperAdmin(email)) {
      return NextResponse.json(
        { success: false, error: `Unauthorized: Only ${SUPER_ADMIN_EMAIL} can verify Admin OTP.` },
        { status: 403 }
      );
    }

    const result = verifyAdminOtp(email, otp);

    if (!result.valid) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired OTP code.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      resetToken: result.resetToken,
      message: 'Admin OTP successfully verified. Proceed to configure Master Password.',
    });
  } catch (error: any) {
    console.error('API /api/admin/verify-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying OTP.' },
      { status: 500 }
    );
  }
}
