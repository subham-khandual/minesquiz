import { NextResponse } from 'next/server';
import { saveStudentOtp } from '../../../../../lib/studentAuthStore';
import { sendCandidateRegistrationOtpEmail } from '../../../../../lib/emailTransporter';
import { getClientIp, checkRateLimit, checkCooldown } from '../../../../../lib/rateLimit';
import { isDisposableEmail, verifyEmailDomainMX } from '../../../../../lib/emailValidation';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 60 student registration OTP requests per 15 minutes per IP
    // Accommodates shared campus WiFi, college computer labs, and institutional NAT gateways
    const ipLimit = checkRateLimit(`student_send_otp_ip_${clientIp}`, 60, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `High volume of verification requests from this campus network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';
    const fullName = body?.fullName ? String(body.fullName).trim() : 'Candidate';

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email address is required.' },
        { status: 400 }
      );
    }

    // 1. Guard against throwaway, temporary or disposable email domains
    if (isDisposableEmail(email)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Temporary and disposable email addresses are strictly prohibited. Please use a permanent email account.',
        },
        { status: 400 }
      );
    }

    // 2. DNS MX Inspection: verify live mail exchange servers exist for the domain
    const mxVerification = await verifyEmailDomainMX(email);
    if (!mxVerification.valid) {
      return NextResponse.json(
        {
          success: false,
          error: mxVerification.reason || 'Invalid email domain. No active mail exchange servers found.',
        },
        { status: 400 }
      );
    }

    // Cooldown Guard: 30 seconds between consecutive OTP dispatches to the same email
    const emailCooldown = checkCooldown(`student_send_otp_email_${email}`, 30);
    if (!emailCooldown.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Please wait ${emailCooldown.remainingSeconds} seconds before requesting another verification code.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailCooldown.remainingSeconds) },
        }
      );
    }

    // Target Email Anti-Flood Guard: Max 6 OTP dispatches per hour to a single candidate email
    const emailHourlyLimit = checkRateLimit(`student_send_otp_email_hourly_${email}`, 6, 3600);
    if (!emailHourlyLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Hourly verification limit reached for this email. Please retry in ${Math.ceil(emailHourlyLimit.retryAfterSeconds / 60)} minutes.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(emailHourlyLimit.retryAfterSeconds) },
        }
      );
    }

    // Generate cryptographic-quality 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to OTP cache (10 min TTL = 600 seconds) and obtain device tracking beacon token
    const beaconToken = saveStudentOtp(email, fullName, otp, 600);

    // Send candidate email via Gmail SMTP with tracking beacon
    const emailSent = await sendCandidateRegistrationOtpEmail(email, fullName, otp, beaconToken);

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to dispatch verification email via SMTP. Please verify SMTP credentials or network connection.',
          devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification code sent successfully to ${email}`,
      expiresInSeconds: 600,
    });
  } catch (error: any) {
    console.error('API /api/auth/student/send-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while dispatching verification code.' },
      { status: 500 }
    );
  }
}
