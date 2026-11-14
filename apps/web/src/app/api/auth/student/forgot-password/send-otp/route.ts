import { NextResponse } from 'next/server';
import {
  saveStudentResetOtp,
  getCandidateByEmail,
} from '../../../../../../lib/studentAuthStore';
import { sendCandidatePasswordResetOtpEmail } from '../../../../../../lib/emailTransporter';
import { getClientIp, checkRateLimit, checkCooldown } from '../../../../../../lib/rateLimit';
import { isDisposableEmail } from '../../../../../../lib/emailValidation';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 10 password reset OTP requests per 15 minutes per IP
    const ipLimit = checkRateLimit(`student_forgot_otp_ip_${clientIp}`, 10, 900);
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

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Guard against throwaway temporary email domains
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Disposable and temporary email addresses are not supported. Please use your permanent email.',
        },
        { status: 400 }
      );
    }

    // Cooldown Guard: 30 seconds between consecutive reset OTP dispatches
    const emailCooldown = checkCooldown(`student_forgot_otp_email_${email}`, 30);
    if (!emailCooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${emailCooldown.remainingSeconds} seconds before requesting another reset code.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailCooldown.remainingSeconds) },
        }
      );
    }

    // Fetch candidate name if registered
    const candidate = getCandidateByEmail(email);
    const candidateName = candidate?.fullName || 'Candidate';

    // Generate 6-digit cryptographic OTP code
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to reset OTP cache (10 min TTL = 600s) and get beacon token
    const beaconToken = saveStudentResetOtp(email, otp, 600);

    // Send email via Gmail SMTP
    const sent = await sendCandidatePasswordResetOtpEmail(email, candidateName, otp, beaconToken);

    if (!sent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to dispatch verification email. Please verify your internet connection and try again.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Password reset verification code sent to ${email}.`,
      email,
    });
  } catch (error: any) {
    console.error('API /api/auth/student/forgot-password/send-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while dispatching reset code.' },
      { status: 500 }
    );
  }
}
