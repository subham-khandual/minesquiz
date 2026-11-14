import { NextResponse } from 'next/server';
import { verifyStudentOtp, saveCandidateAccount } from '../../../../../lib/studentAuthStore';
import { getClientIp, checkRateLimit } from '../../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 180 OTP verification attempts per 15 minutes per IP
    // Accommodates shared campus WiFi, computer labs, and multi-candidate test centers
    const ipLimit = checkRateLimit(`student_verify_otp_ip_${clientIp}`, 180, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `High volume of verification attempts from this campus network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
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
    const password = body?.password ? String(body.password) : '';

    if (!email || !otp) {
      return NextResponse.json(
        { success: false, error: 'Both email and 6-digit OTP code are required.' },
        { status: 400 }
      );
    }

    const result = verifyStudentOtp(email, otp);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid or expired verification code.' },
        { status: 400 }
      );
    }

    // If password provided during initial registration, store salted hash account
    let candidate;
    if (password && password.length >= 8) {
      const saveRes = saveCandidateAccount(email, result.fullName || '', password);
      candidate = saveRes.candidate;
    }

    const token = 'cand-jwt-' + Buffer.from(email + ':' + Date.now()).toString('base64');

    return NextResponse.json({
      success: true,
      message: 'Candidate email successfully verified.',
      email,
      fullName: result.fullName,
      deviceTelemetry: result.deviceTelemetry,
      candidate: candidate
        ? {
            id: candidate.id,
            email: candidate.email,
            displayName: candidate.fullName,
            role: 'student',
          }
        : undefined,
      token,
    });
  } catch (error: any) {
    console.error('API /api/auth/student/verify-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while verifying code.' },
      { status: 500 }
    );
  }
}
