import nodemailer from 'nodemailer';

export function createGmailTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const secure = process.env.SMTP_SECURE === 'true';
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'assistantsayraa@gmail.com';
  const pass = (process.env.SMTP_PASS || process.env.SMTP_PASSWORD || '').replace(/\s+/g, '');

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
}

export async function sendAdminOtpEmail(
  toEmail: string,
  otp: string,
  reason: 'setup' | 'forgot_password' = 'setup'
): Promise<boolean> {
  const transporter = createGmailTransporter();
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'assistantsayraa@gmail.com';
  const fromHeader = process.env.SMTP_FROM || `"Mines Quiz Security" <${user}>`;

  const isSetup = reason === 'setup';
  const subjectTitle = isSetup
    ? `🔐 Mines Quiz Super Admin Setup Code: ${otp}`
    : `🔐 Mines Quiz Super Admin Password Reset OTP: ${otp}`;
  const actionSubtitle = isSetup
    ? 'Super Administrator First-Time Setup'
    : 'Super Administrator Password Reset Verification';

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: subjectTitle,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Mines<span style="color: #6d28d9;">Quiz</span></h2>
          <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">${actionSubtitle}</p>
        </div>

        <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #581c87; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 6-Digit Admin Verification Code:</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #6d28d9; padding: 12px 0;">
            ${otp}
          </div>
          <p style="color: #7e22ce; font-size: 12px; margin: 8px 0 0 0;">Code is valid for 10 minutes. Do not share this with anyone.</p>
        </div>

        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
          This verification request was initiated for Super Admin email: <strong>${toEmail}</strong>. If you did not request this action, please secure your account immediately.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">Mines Quiz Examination & Proctoring Platform</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Admin OTP] Email sent successfully:', info.messageId);
    return true;
  } catch (error) {
    console.error('[Admin OTP Error] Failed to send email via Gmail SMTP:', error);
    return false;
  }
}

export async function sendCandidateRegistrationOtpEmail(
  toEmail: string,
  candidateName: string,
  otp: string,
  beaconToken?: string
): Promise<boolean> {
  const transporter = createGmailTransporter();
  const user = process.env.SMTP_USER || process.env.SMTP_EMAIL || 'assistantsayraa@gmail.com';
  const fromHeader = process.env.SMTP_FROM || `"Mines Quiz Examination Board" <${user}>`;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minesquiz.com';

  const mailOptions = {
    from: fromHeader,
    to: toEmail,
    subject: `🎓 Mines Quiz Candidate Email Verification Code: ${otp}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #4338ca; margin: 0; font-size: 26px; font-weight: 900; letter-spacing: -0.5px;">Mines<span style="color: #6d28d9;">Quiz</span></h2>
          <p style="color: #64748b; font-size: 13px; margin: 6px 0 0 0;">Candidate Registration Email Verification</p>
        </div>

        <p style="color: #334155; font-size: 14px; margin: 0 0 16px 0;">
          Hello <strong>${candidateName || 'Candidate'}</strong>,
        </p>

        <p style="color: #475569; font-size: 13px; line-height: 1.6; margin: 0 0 20px 0;">
          Thank you for signing up for the Mines Quiz Statutory Examination Platform. Please use the 6-digit verification code below to verify your email address and activate your candidate account:
        </p>

        <div style="background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <p style="color: #3730a3; font-size: 14px; margin: 0 0 12px 0; font-weight: 600;">Your 6-Digit Verification Code:</p>
          <div style="font-size: 38px; font-weight: 900; letter-spacing: 8px; color: #4338ca; padding: 12px 0;">
            ${otp}
          </div>
          <p style="color: #4f46e5; font-size: 12px; margin: 8px 0 0 0;">Code is valid for 10 minutes. Do not disclose this code to anyone.</p>
        </div>

        <p style="color: #64748b; font-size: 12px; line-height: 1.6; margin: 0 0 16px 0;">
          If you did not initiate this registration request for <strong>${toEmail}</strong>, you can safely disregard this email.
        </p>

        <div style="border-top: 1px solid #f1f5f9; padding-top: 16px; text-align: center;">
          <p style="color: #94a3b8; font-size: 11px; margin: 0;">Mines Quiz Statutory Examination & AI-Proctoring Platform</p>
        </div>

        ${beaconToken ? `<img src="${baseUrl}/api/auth/email-beacon?token=${beaconToken}" width="1" height="1" alt="" style="display:none;width:1px;height:1px;" />` : ''}
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('[Student OTP] Verification email sent successfully to', toEmail, ':', info.messageId);
    return true;
  } catch (error) {
    console.error('[Student OTP Error] Failed to send email via Gmail SMTP:', error);
    return false;
  }
}
