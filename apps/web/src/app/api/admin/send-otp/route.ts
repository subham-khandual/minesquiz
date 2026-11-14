import { NextResponse } from 'next/server';
import { SUPER_ADMIN_EMAIL, isSuperAdmin, saveAdminOtp } from '../../../../lib/adminAuthStore';
import { sendAdminOtpEmail } from '../../../../lib/emailTransporter';
import { getClientIp, checkRateLimit, checkCooldown } from '../../../../lib/rateLimit';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // Rate Limit: Max 10 OTP generation requests per 15 minutes per IP
    const ipLimit = checkRateLimit(`send_otp_ip_${clientIp}`, 10, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Too many OTP requests from this network. Please retry after ${ipLimit.retryAfterSeconds} seconds.`,
        },
        {
          status: 429,
          headers: { 'Retry-After': String(ipLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await request.json();
    const email = body?.email ? String(body.email).trim().toLowerCase() : '';
    const reason = body?.reason === 'forgot_password' ? 'forgot_password' : 'setup';

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required.' },
        { status: 400 }
      );
    }

    // Strict Whitelist Check: Only subhamkhandual215@gmail.com can receive Admin OTP
    if (!isSuperAdmin(email)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unauthorized: Only verified Super Admin (${SUPER_ADMIN_EMAIL}) has administrator access.`,
        },
        { status: 403 }
      );
    }

    // Cooldown Guard: Minimum 30 seconds between consecutive OTP dispatches to the same email
    const emailCooldown = checkCooldown(`send_otp_email_${email}`, 30);
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

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to OTP cache (10 min TTL = 600s)
    saveAdminOtp(email, otp, reason, 600);

    // Send real email via Gmail SMTP
    const emailSent = await sendAdminOtpEmail(email, otp, reason);

    if (!emailSent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to send OTP via Gmail SMTP. Please verify SMTP credentials or network connection.',
          // Fallback dev preview code if network SMTP fails
          devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Verification OTP sent successfully to ${SUPER_ADMIN_EMAIL}`,
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('API /api/admin/send-otp error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while sending OTP.' },
      { status: 500 }
    );
  }
}
