import { NextResponse } from 'next/server';
import { verifyCandidateCredentials } from '../../../../../lib/studentAuthStore';
import { getClientIp, checkRateLimit } from '../../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 30 student login attempts per 15 minutes per IP
    const ipLimit = checkRateLimit(`student_login_ip_${clientIp}`, 30, 900);
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
        { success: false, error: 'Both email and password are required.' },
        { status: 400 }
      );
    }

    const result = verifyCandidateCredentials(email, password);

    if (!result.success || !result.candidate) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Invalid email or password. Please verify your credentials.',
        },
        { status: 401 }
      );
    }

    const token = 'cand-jwt-' + Buffer.from(email + ':' + Date.now()).toString('base64');

    return NextResponse.json({
      success: true,
      user: {
        id: result.candidate.id,
        firebaseUid: result.candidate.id,
        email: result.candidate.email,
        displayName: result.candidate.fullName,
        role: 'student',
        createdAt: result.candidate.createdAt,
        updatedAt: result.candidate.updatedAt,
      },
      token,
      message: 'Student authentication successful.',
    });
  } catch (error: any) {
    console.error('API /api/auth/student/login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error during student login.' },
      { status: 500 }
    );
  }
}
